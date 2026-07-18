import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Reminder, ReminderDelivery } from "@/features/reminders";
import { ReminderProcessorService } from "@/services/reminder-processor.service";

const now = new Date("2026-07-24T13:00:00.000Z");
const reminder: Reminder = {
  id: "rem_0123456789abcdef0123456789abcdef",
  patientId: "45ae0fb2-dfd0-49a6-a426-eb492bcbad46",
  source: "CLINICAL_EVENT",
  sourceId: "9d1138d8-89b7-47ba-a570-a0a92cc0a850",
  targetDate: "2026-07-25",
  scheduledFor: "2026-07-24T12:00:00.000Z",
  timezone: "America/La_Paz",
  channel: "IN_APP",
  status: "PENDING",
  attempts: 0,
  maxAttempts: 3,
  createdAt: "2026-07-17T15:00:00.000Z",
  updatedAt: "2026-07-17T15:00:00.000Z",
};

describe("ReminderProcessorService", () => {
  const repository = {
    listDue: vi.fn(),
    listByStatus: vi.fn(),
    claimForProcessing: vi.fn(),
    update: vi.fn(),
  };
  const delivery: ReminderDelivery = { channel: "IN_APP", deliver: vi.fn() };

  beforeEach(() => {
    vi.clearAllMocks();
    repository.listDue.mockResolvedValue([reminder]);
    repository.listByStatus.mockResolvedValue([]);
    repository.claimForProcessing.mockResolvedValue({
      ...reminder,
      status: "PROCESSING",
      attempts: 1,
      lastAttemptAt: now.toISOString(),
    });
    repository.update.mockResolvedValue(undefined);
    vi.mocked(delivery.deliver).mockResolvedValue({});
  });

  function processor(): ReminderProcessorService {
    return new ReminderProcessorService({
      repository: repository as never,
      deliveries: [delivery],
      now: () => now,
    });
  }

  it("claims and sends each due reminder", async () => {
    await expect(processor().processDue()).resolves.toEqual({
      claimed: 1,
      sent: 1,
      retried: 0,
      failed: 0,
      skipped: 0,
      recovered: 0,
    });
    expect(repository.claimForProcessing).toHaveBeenCalledWith(reminder.id, now.toISOString(), 300);
    expect(repository.update).toHaveBeenCalledWith(
      reminder.id,
      expect.objectContaining({ status: "SENT", sentAt: now.toISOString() }),
    );
  });

  it("skips a reminder claimed by another worker", async () => {
    repository.claimForProcessing.mockResolvedValue(null);
    const result = await processor().processDue();
    expect(result.skipped).toBe(1);
    expect(delivery.deliver).not.toHaveBeenCalled();
  });

  it("returns a failed delivery to pending while attempts remain", async () => {
    vi.mocked(delivery.deliver).mockRejectedValue(new Error("temporary\nerror"));
    const result = await processor().processDue();
    expect(result.retried).toBe(1);
    expect(repository.update).toHaveBeenCalledWith(
      reminder.id,
      expect.objectContaining({ status: "PENDING", lastError: "temporary error" }),
    );
  });

  it("marks the reminder failed after the maximum attempts", async () => {
    repository.claimForProcessing.mockResolvedValue({
      ...reminder,
      status: "PROCESSING",
      attempts: 3,
      lastAttemptAt: now.toISOString(),
    });
    vi.mocked(delivery.deliver).mockRejectedValue(new Error("permanent error"));
    const result = await processor().processDue();
    expect(result.failed).toBe(1);
    expect(repository.update).toHaveBeenCalledWith(
      reminder.id,
      expect.objectContaining({ status: "FAILED" }),
    );
  });

  it("recovers stale processing reminders", async () => {
    repository.listDue.mockResolvedValue([]);
    repository.listByStatus.mockResolvedValue([
      {
        ...reminder,
        status: "PROCESSING",
        attempts: 1,
        lastAttemptAt: "2026-07-24T12:00:00.000Z",
      },
    ]);
    const result = await processor().processDue();
    expect(result.recovered).toBe(1);
    expect(repository.update).toHaveBeenCalledWith(
      reminder.id,
      expect.objectContaining({ status: "PENDING" }),
    );
  });
});
