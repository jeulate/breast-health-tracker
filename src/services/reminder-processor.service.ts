import {
  inAppReminderDelivery,
  type Reminder,
  type ReminderChannel,
  type ReminderDelivery,
} from "@/features/reminders";
import { ReminderRepository } from "@/repositories/reminder.repository";

export interface ReminderProcessingSummary {
  claimed: number;
  sent: number;
  retried: number;
  failed: number;
  skipped: number;
  recovered: number;
}

export interface ReminderProcessorOptions {
  repository?: ReminderRepository;
  deliveries?: readonly ReminderDelivery[];
  now?: () => Date;
  lockSeconds?: number;
  staleAfterMs?: number;
}

function safeErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : "Unknown delivery error";
  return (
    message
      .replace(/[\r\n\t]+/g, " ")
      .trim()
      .slice(0, 500) || "Unknown delivery error"
  );
}

export class ReminderProcessorService {
  private readonly repository: ReminderRepository;
  private readonly deliveries: Map<ReminderChannel, ReminderDelivery>;
  private readonly now: () => Date;
  private readonly lockSeconds: number;
  private readonly staleAfterMs: number;

  constructor(options: ReminderProcessorOptions = {}) {
    this.repository = options.repository ?? new ReminderRepository();
    this.deliveries = new Map(
      (options.deliveries ?? [inAppReminderDelivery]).map((delivery) => [
        delivery.channel,
        delivery,
      ]),
    );
    this.now = options.now ?? (() => new Date());
    this.lockSeconds = options.lockSeconds ?? 300;
    this.staleAfterMs = options.staleAfterMs ?? 15 * 60 * 1000;
  }

  async processDue(limit = 100): Promise<ReminderProcessingSummary> {
    const summary = this.emptySummary();
    summary.recovered = await this.recoverStale();
    const due = await this.repository.listDue(this.now().toISOString(), limit);

    for (const reminder of due) {
      const claimed = await this.repository.claimForProcessing(
        reminder.id,
        this.now().toISOString(),
        this.lockSeconds,
      );
      if (!claimed) {
        summary.skipped += 1;
        continue;
      }

      summary.claimed += 1;
      await this.deliver(claimed, summary);
    }

    return summary;
  }

  async recoverStale(): Promise<number> {
    const processing = await this.repository.listByStatus("PROCESSING");
    const cutoff = this.now().getTime() - this.staleAfterMs;
    let recovered = 0;

    for (const reminder of processing) {
      if (!reminder.lastAttemptAt || Date.parse(reminder.lastAttemptAt) > cutoff) continue;
      const exhausted = reminder.attempts >= reminder.maxAttempts;
      await this.repository.update(reminder.id, {
        status: exhausted ? "FAILED" : "PENDING",
        lastError: "Processing lease expired before delivery completed.",
      });
      recovered += 1;
    }

    return recovered;
  }

  private async deliver(reminder: Reminder, summary: ReminderProcessingSummary): Promise<void> {
    const delivery = this.deliveries.get(reminder.channel);

    try {
      if (!delivery) throw new Error(`No delivery adapter for channel ${reminder.channel}`);
      await delivery.deliver(reminder);
      await this.repository.update(reminder.id, {
        status: "SENT",
        sentAt: this.now().toISOString(),
        lastError: undefined,
      });
      summary.sent += 1;
    } catch (error) {
      const exhausted = reminder.attempts >= reminder.maxAttempts;
      await this.repository.update(reminder.id, {
        status: exhausted ? "FAILED" : "PENDING",
        lastError: safeErrorMessage(error),
      });
      if (exhausted) summary.failed += 1;
      else summary.retried += 1;
    }
  }

  private emptySummary(): ReminderProcessingSummary {
    return { claimed: 0, sent: 0, retried: 0, failed: 0, skipped: 0, recovered: 0 };
  }
}
