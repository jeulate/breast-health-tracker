import { createHash } from "crypto";
import type { ReminderIdentityInput } from "./reminder.types";

function normalizeScheduledFor(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error("scheduledFor must be a valid ISO date-time");
  }

  return date.toISOString();
}

/**
 * Generates the same identifier for an equivalent source, schedule and
 * channel. This provides an idempotency boundary before persistence exists.
 */
export function buildReminderId(input: ReminderIdentityInput): string {
  const fingerprint = [
    input.source,
    input.sourceId.trim().toLowerCase(),
    normalizeScheduledFor(input.scheduledFor),
    input.channel,
  ].join("|");

  const digest = createHash("sha256").update(fingerprint).digest("hex").slice(0, 32);
  return `rem_${digest}`;
}
