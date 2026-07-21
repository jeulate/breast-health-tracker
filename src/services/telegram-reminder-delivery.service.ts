import { Bot } from "grammy";
import type { Reminder, ReminderDelivery, ReminderDeliveryResult } from "@/features/reminders";
import { buildTelegramReminderMessage } from "@/features/telegram/telegram-reminder-message";
import { PatientRepository } from "@/repositories/patient.repository";
import type { Patient } from "@/types";

interface PatientLookup {
  findById(id: string): Promise<Patient | null>;
}

interface TelegramMessageSender {
  sendMessage(chatId: string, text: string): Promise<{ message_id: number }>;
}

export interface TelegramReminderDeliveryOptions {
  token?: string;
  patients?: PatientLookup;
  sender?: TelegramMessageSender;
}

export class TelegramReminderDelivery implements ReminderDelivery {
  readonly channel = "TELEGRAM" as const;
  private readonly patients: PatientLookup;
  private readonly sender: TelegramMessageSender;

  constructor(options: TelegramReminderDeliveryOptions) {
    this.patients = options.patients ?? new PatientRepository();
    if (options.sender) {
      this.sender = options.sender;
    } else {
      if (!options.token) throw new Error("Telegram bot token is required");
      this.sender = new Bot(options.token).api;
    }
  }

  async deliver(reminder: Reminder): Promise<ReminderDeliveryResult> {
    const patient = await this.patients.findById(reminder.patientId);
    if (!patient) throw new Error("Patient not found for Telegram delivery");
    if (!patient.telegramChatId) throw new Error("Patient has no Telegram chat linked");

    const message = await this.sender.sendMessage(
      patient.telegramChatId,
      buildTelegramReminderMessage(reminder.targetDate),
    );
    return { externalId: String(message.message_id) };
  }
}
