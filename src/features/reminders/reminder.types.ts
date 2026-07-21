export const REMINDER_SOURCES = ["CLINICAL_EVENT", "FINDING_NEXT_CONTROL"] as const;
export const REMINDER_STATUSES = [
  "PENDING",
  "PROCESSING",
  "SENT",
  "COMPLETED",
  "CANCELLED",
  "FAILED",
] as const;
export const REMINDER_CHANNELS = ["IN_APP", "TELEGRAM"] as const;

export type ReminderSource = (typeof REMINDER_SOURCES)[number];
export type ReminderStatus = (typeof REMINDER_STATUSES)[number];
export type ReminderChannel = (typeof REMINDER_CHANNELS)[number];

/**
 * A reminder references an existing clinical source. It intentionally avoids
 * copying clinical descriptions or patient names into a second entity.
 */
export interface Reminder {
  id: string;
  patientId: string;
  source: ReminderSource;
  sourceId: string;
  targetDate: string;
  scheduledFor: string;
  timezone: string;
  channel: ReminderChannel;
  status: ReminderStatus;
  attempts: number;
  maxAttempts: number;
  lastAttemptAt?: string;
  processedAt?: string;
  sentAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  lastError?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReminderIdentityInput {
  source: ReminderSource;
  sourceId: string;
  scheduledFor: string;
  channel: ReminderChannel;
}

/** A selectable source. Clinical details remain in their original entity. */
export interface ReminderCandidate {
  id: string;
  source: ReminderSource;
  sourceId: string;
  targetDate: string;
  title: string;
}
