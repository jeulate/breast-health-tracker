import { describe, expect, it, vi } from "vitest";
import type { Reminder } from "@/features/reminders";
import { TelegramReminderDelivery } from "@/services/telegram-reminder-delivery.service";

const reminder: Reminder = {
  id: "rem_0123456789abcdef0123456789abcdef",
  patientId: "45ae0fb2-dfd0-49a6-a426-eb492bcbad46",
  source: "CLINICAL_EVENT",
  sourceId: "9d1138d8-89b7-47ba-a570-a0a92cc0a850",
  targetDate: "2026-07-25",
  scheduledFor: "2026-07-24T12:00:00.000Z",
  timezone: "America/La_Paz",
  channel: "TELEGRAM",
  status: "PENDING",
  attempts: 0,
  maxAttempts: 3,
  createdAt: "2026-07-17T15:00:00.000Z",
  updatedAt: "2026-07-17T15:00:00.000Z",
};

describe("TelegramReminderDelivery", () => {
  it("sends a generic message to the linked chat", async () => {
    const patients = {
      findById: vi.fn().mockResolvedValue({ id: reminder.patientId, telegramChatId: "123" }),
    };
    const sender = { sendMessage: vi.fn().mockResolvedValue({ message_id: 77 }) };
    const delivery = new TelegramReminderDelivery({ patients: patients as never, sender });
    await expect(delivery.deliver(reminder)).resolves.toEqual({ externalId: "77" });
    expect(sender.sendMessage).toHaveBeenCalledWith(
      "123",
      expect.stringContaining("Recordatorio administrativo"),
    );
  });

  it("fails safely when the patient has no linked chat", async () => {
    const patients = { findById: vi.fn().mockResolvedValue({ id: reminder.patientId }) };
    const sender = { sendMessage: vi.fn() };
    const delivery = new TelegramReminderDelivery({ patients: patients as never, sender });
    await expect(delivery.deliver(reminder)).rejects.toThrow("no Telegram chat linked");
    expect(sender.sendMessage).not.toHaveBeenCalled();
  });
});
