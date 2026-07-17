import type { ReminderStatus } from "./reminder.types";

const transitions: Record<ReminderStatus, readonly ReminderStatus[]> = {
  PENDING: ["PROCESSING", "COMPLETED", "CANCELLED"],
  PROCESSING: ["PENDING", "SENT", "FAILED"],
  SENT: ["COMPLETED"],
  FAILED: ["PENDING", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

export function canTransitionReminder(current: ReminderStatus, next: ReminderStatus): boolean {
  return transitions[current].includes(next);
}
