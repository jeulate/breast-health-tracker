import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Reminder } from "@/features/reminders";

const mocks = vi.hoisted(() => ({
  patient: { findById: vi.fn() },
  clinicalEvent: { findById: vi.fn() },
  finding: { findById: vi.fn() },
  reminder: {
    findById: vi.fn(),
    save: vi.fn(),
    update: vi.fn(),
    listByPatient: vi.fn(),
  },
}));

vi.mock("@/repositories/patient.repository", () => ({
  PatientRepository: class {
    findById = mocks.patient.findById;
  },
}));
vi.mock("@/repositories/clinical-event.repository", () => ({
  ClinicalEventRepository: class {
    findById = mocks.clinicalEvent.findById;
  },
}));
vi.mock("@/repositories/finding.repository", () => ({
  FindingRepository: class {
    findById = mocks.finding.findById;
  },
}));
vi.mock("@/repositories/reminder.repository", () => ({
  ReminderRepository: class {
    findById = mocks.reminder.findById;
    save = mocks.reminder.save;
    update = mocks.reminder.update;
    listByPatient = mocks.reminder.listByPatient;
  },
}));

import { ReminderService } from "@/services/reminder.service";

const patientId = "45ae0fb2-dfd0-49a6-a426-eb492bcbad46";
const sourceId = "9d1138d8-89b7-47ba-a570-a0a92cc0a850";
const patient = { id: patientId, status: "ACTIVE", timezone: "America/La_Paz" };
const event = {
  id: sourceId,
  patientId,
  type: "CONTROL",
  status: "SCHEDULED",
  eventDate: "2026-07-25",
};
const createInput = {
  patientId,
  source: "CLINICAL_EVENT" as const,
  sourceId,
  targetDate: "2026-07-25",
  scheduledFor: "2026-07-24T09:00:00-04:00",
};
const reminder: Reminder = {
  id: "rem_0123456789abcdef0123456789abcdef",
  patientId,
  source: "CLINICAL_EVENT",
  sourceId,
  targetDate: "2026-07-25",
  scheduledFor: "2026-07-24T13:00:00.000Z",
  timezone: "America/La_Paz",
  channel: "IN_APP",
  status: "PENDING",
  attempts: 0,
  maxAttempts: 3,
  createdAt: "2026-07-17T15:00:00.000Z",
  updatedAt: "2026-07-17T15:00:00.000Z",
};

describe("ReminderService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-17T15:00:00.000Z"));
    mocks.patient.findById.mockResolvedValue(patient);
    mocks.clinicalEvent.findById.mockResolvedValue(event);
    mocks.finding.findById.mockResolvedValue(null);
    mocks.reminder.findById.mockResolvedValue(null);
    mocks.reminder.save.mockResolvedValue(undefined);
    mocks.reminder.update.mockResolvedValue(undefined);
    mocks.reminder.listByPatient.mockResolvedValue([]);
  });

  it("creates an idempotent pending reminder for a scheduled control", async () => {
    const result = await ReminderService.create(createInput);

    expect(result).toEqual(
      expect.objectContaining({
        id: expect.stringMatching(/^rem_[a-f0-9]{32}$/),
        patientId,
        scheduledFor: "2026-07-24T13:00:00.000Z",
        status: "PENDING",
        attempts: 0,
      }),
    );
    expect(mocks.reminder.save).toHaveBeenCalledWith(result);
  });

  it("returns an existing equivalent reminder without saving it again", async () => {
    mocks.reminder.findById.mockResolvedValue(reminder);

    await expect(ReminderService.create(createInput)).resolves.toBe(reminder);
    expect(mocks.reminder.save).not.toHaveBeenCalled();
  });

  it("returns the active reminder for the same source even after its schedule changed", async () => {
    mocks.reminder.listByPatient.mockResolvedValue([reminder]);

    await expect(
      ReminderService.create({
        ...createInput,
        scheduledFor: "2026-07-23T09:00:00-04:00",
      }),
    ).resolves.toBe(reminder);
    expect(mocks.reminder.save).not.toHaveBeenCalled();
  });

  it("rejects inactive or missing patients", async () => {
    mocks.patient.findById.mockResolvedValue({ ...patient, status: "INACTIVE" });

    await expect(ReminderService.create(createInput)).resolves.toBeNull();
    expect(mocks.reminder.save).not.toHaveBeenCalled();
  });

  it("rejects Telegram reminders when the patient has no linked chat", async () => {
    await expect(
      ReminderService.create({ ...createInput, channel: "TELEGRAM" }),
    ).resolves.toBeNull();
    expect(mocks.reminder.save).not.toHaveBeenCalled();
  });

  it("creates Telegram reminders when the patient has a linked chat", async () => {
    mocks.patient.findById.mockResolvedValue({ ...patient, telegramChatId: "987654321" });

    const result = await ReminderService.create({ ...createInput, channel: "TELEGRAM" });

    expect(result?.channel).toBe("TELEGRAM");
    expect(mocks.reminder.save).toHaveBeenCalledWith(result);
  });

  it("rejects controls that do not belong to the patient", async () => {
    mocks.clinicalEvent.findById.mockResolvedValue({ ...event, patientId: sourceId });

    await expect(ReminderService.create(createInput)).resolves.toBeNull();
  });

  it("rejects non-scheduled controls and mismatched target dates", async () => {
    mocks.clinicalEvent.findById.mockResolvedValue({ ...event, status: "COMPLETED" });
    await expect(ReminderService.create(createInput)).resolves.toBeNull();

    mocks.clinicalEvent.findById.mockResolvedValue(event);
    await expect(
      ReminderService.create({ ...createInput, targetDate: "2026-07-26" }),
    ).resolves.toBeNull();
  });

  it("creates a reminder for an open finding next control", async () => {
    mocks.finding.findById.mockResolvedValue({
      id: sourceId,
      patientId,
      status: "FOLLOW_UP",
      nextControlDate: "2026-07-25",
    });

    const result = await ReminderService.create({
      ...createInput,
      source: "FINDING_NEXT_CONTROL",
    });

    expect(result?.source).toBe("FINDING_NEXT_CONTROL");
    expect(mocks.clinicalEvent.findById).not.toHaveBeenCalled();
  });

  it("rejects closed findings", async () => {
    mocks.finding.findById.mockResolvedValue({
      id: sourceId,
      patientId,
      status: "CLOSED",
      nextControlDate: "2026-07-25",
    });

    await expect(
      ReminderService.create({ ...createInput, source: "FINDING_NEXT_CONTROL" }),
    ).resolves.toBeNull();
  });

  it("rejects schedules after the target date in the selected timezone", async () => {
    await expect(
      ReminderService.create({ ...createInput, scheduledFor: "2026-07-26T00:01:00-04:00" }),
    ).resolves.toBeNull();
  });

  it("returns null when listing reminders for an unknown patient", async () => {
    mocks.patient.findById.mockResolvedValue(null);
    await expect(ReminderService.listByPatient(patientId)).resolves.toBeNull();
  });

  it("lists reminders for an existing patient", async () => {
    mocks.reminder.listByPatient.mockResolvedValue([reminder]);
    await expect(ReminderService.listByPatient(patientId)).resolves.toEqual([reminder]);
    expect(mocks.reminder.listByPatient).toHaveBeenCalledWith(patientId, "asc");
  });

  it("reschedules pending reminders and normalizes the timestamp", async () => {
    const updated = { ...reminder, scheduledFor: "2026-07-23T13:00:00.000Z" };
    mocks.reminder.findById.mockResolvedValueOnce(reminder).mockResolvedValueOnce(updated);

    await expect(
      ReminderService.reschedule(patientId, reminder.id, {
        scheduledFor: "2026-07-23T09:00:00-04:00",
      }),
    ).resolves.toEqual(updated);
    expect(mocks.reminder.update).toHaveBeenCalledWith(
      reminder.id,
      expect.objectContaining({
        scheduledFor: "2026-07-23T13:00:00.000Z",
        status: "PENDING",
      }),
    );
  });

  it("does not reschedule completed reminders", async () => {
    mocks.reminder.findById.mockResolvedValue({ ...reminder, status: "COMPLETED" });

    await expect(
      ReminderService.reschedule(patientId, reminder.id, {
        scheduledFor: "2026-07-23T09:00:00-04:00",
      }),
    ).resolves.toBeNull();
  });

  it("cancels a pending reminder using an allowed transition", async () => {
    const cancelled = { ...reminder, status: "CANCELLED" as const };
    mocks.reminder.findById.mockResolvedValueOnce(reminder).mockResolvedValueOnce(cancelled);

    await expect(ReminderService.cancel(patientId, reminder.id)).resolves.toEqual(cancelled);
    expect(mocks.reminder.update).toHaveBeenCalledWith(
      reminder.id,
      expect.objectContaining({ status: "CANCELLED", cancelledAt: expect.any(String) }),
    );
  });

  it("completes a sent reminder but keeps terminal states immutable", async () => {
    const sent = { ...reminder, status: "SENT" as const, sentAt: reminder.updatedAt };
    const completed = { ...sent, status: "COMPLETED" as const, completedAt: reminder.updatedAt };
    mocks.reminder.findById.mockResolvedValueOnce(sent).mockResolvedValueOnce(completed);

    await expect(ReminderService.complete(patientId, reminder.id)).resolves.toEqual(completed);

    mocks.reminder.findById.mockResolvedValue(completed);
    await expect(ReminderService.cancel(patientId, reminder.id)).resolves.toBeNull();
  });
});
