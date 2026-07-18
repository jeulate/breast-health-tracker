import type { Reminder, ReminderChannel } from "./reminder.types";

export interface ReminderDeliveryResult {
  externalId?: string;
}

export interface ReminderDelivery {
  readonly channel: ReminderChannel;
  deliver(reminder: Reminder): Promise<ReminderDeliveryResult>;
}

export const inAppReminderDelivery: ReminderDelivery = {
  channel: "IN_APP",
  async deliver(): Promise<ReminderDeliveryResult> {
    return {};
  },
};
