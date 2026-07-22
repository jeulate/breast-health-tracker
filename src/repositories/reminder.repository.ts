import type { Redis } from "@upstash/redis";
import type { Reminder, ReminderStatus } from "@/features/reminders";
import { reminderSchema } from "@/lib/validations/reminder";
import { getRedisClient } from "@/lib/redis/client";
import { redisKeys } from "@/lib/redis/keys";

export type ReminderSortDirection = "asc" | "desc";

export interface ReminderUpdateFields {
  targetDate?: string;
  scheduledFor?: string;
  timezone?: string;
  status?: ReminderStatus;
  attempts?: number;
  maxAttempts?: number;
  lastAttemptAt?: string | undefined;
  processedAt?: string | undefined;
  sentAt?: string | undefined;
  completedAt?: string | undefined;
  cancelledAt?: string | undefined;
  lastError?: string | undefined;
}

const optionalFields = [
  "lastAttemptAt",
  "processedAt",
  "sentAt",
  "completedAt",
  "cancelledAt",
  "lastError",
] as const;

function hasOwnField(object: object, field: PropertyKey): boolean {
  return Object.prototype.hasOwnProperty.call(object, field);
}

export class ReminderRepository {
  private get redis(): Redis {
    return getRedisClient();
  }

  private key(id: string): string {
    return redisKeys.reminder(id);
  }

  async findById(id: string): Promise<Reminder | null> {
    const data = await this.redis.hgetall<Record<string, unknown>>(this.key(id));

    if (!data || Object.keys(data).length === 0) return null;

    return this.deserialize(data);
  }

  async save(reminder: Reminder): Promise<void> {
    const score = this.scheduledForScore(reminder.scheduledFor);
    const pipeline = this.redis.pipeline();

    pipeline.hset(this.key(reminder.id), this.serialize(reminder));
    pipeline.sadd(redisKeys.remindersIndex(), reminder.id);
    pipeline.sadd(redisKeys.remindersByStatus(reminder.status), reminder.id);
    pipeline.zadd(redisKeys.remindersByScheduledFor(), { score, member: reminder.id });
    pipeline.zadd(redisKeys.patientRemindersByScheduledFor(reminder.patientId), {
      score,
      member: reminder.id,
    });

    await pipeline.exec();
  }

  async update(id: string, fields: ReminderUpdateFields): Promise<void> {
    const existing = await this.findById(id);
    if (!existing) return;

    const pipeline = this.redis.pipeline();
    const values: Record<string, string> = { updatedAt: new Date().toISOString() };

    if (fields.targetDate !== undefined) values.targetDate = fields.targetDate;
    if (fields.scheduledFor !== undefined) values.scheduledFor = fields.scheduledFor;
    if (fields.timezone !== undefined) values.timezone = fields.timezone;
    if (fields.status !== undefined) values.status = fields.status;
    if (fields.attempts !== undefined) values.attempts = String(fields.attempts);
    if (fields.maxAttempts !== undefined) values.maxAttempts = String(fields.maxAttempts);

    const fieldsToDelete: string[] = [];
    for (const field of optionalFields) {
      if (!hasOwnField(fields, field)) continue;

      const value = fields[field];
      if (value === undefined) fieldsToDelete.push(field);
      else values[field] = value;
    }

    pipeline.hset(this.key(id), values);
    if (fieldsToDelete.length > 0) pipeline.hdel(this.key(id), ...fieldsToDelete);

    if (fields.status !== undefined && fields.status !== existing.status) {
      pipeline.srem(redisKeys.remindersByStatus(existing.status), id);
      pipeline.sadd(redisKeys.remindersByStatus(fields.status), id);
    }

    if (fields.scheduledFor !== undefined) {
      const score = this.scheduledForScore(fields.scheduledFor);
      pipeline.zadd(redisKeys.remindersByScheduledFor(), { score, member: id });
      pipeline.zadd(redisKeys.patientRemindersByScheduledFor(existing.patientId), {
        score,
        member: id,
      });
    }

    await pipeline.exec();
  }

  async listByPatient(
    patientId: string,
    direction: ReminderSortDirection = "asc",
  ): Promise<Reminder[]> {
    const ids = (await this.redis.zrange(
      redisKeys.patientRemindersByScheduledFor(patientId),
      0,
      -1,
      { rev: direction === "desc" },
    )) as string[];

    const reminders = await Promise.all(ids.map((id) => this.findById(id)));
    return reminders.filter(
      (reminder): reminder is Reminder => reminder !== null && reminder.patientId === patientId,
    );
  }

  async listDue(cutoff: string, limit = 100): Promise<Reminder[]> {
    const cutoffScore = this.scheduledForScore(cutoff);
    const ids = (await this.redis.zrange(redisKeys.remindersByScheduledFor(), 0, cutoffScore, {
      byScore: true,
    })) as string[];

    const reminders = await Promise.all(ids.slice(0, limit).map((id) => this.findById(id)));
    return reminders.filter(
      (reminder): reminder is Reminder => reminder !== null && reminder.status === "PENDING",
    );
  }

  async listByStatus(status: ReminderStatus): Promise<Reminder[]> {
    const ids = (await this.redis.smembers(redisKeys.remindersByStatus(status))) as string[];
    const reminders = await Promise.all(ids.map((id) => this.findById(id)));
    return reminders.filter(
      (reminder): reminder is Reminder => reminder !== null && reminder.status === status,
    );
  }

  async claimForProcessing(
    id: string,
    attemptedAt: string,
    lockSeconds = 300,
  ): Promise<Reminder | null> {
    const locked = await this.redis.set(redisKeys.reminderProcessingLock(id), attemptedAt, {
      nx: true,
      ex: lockSeconds,
    });
    if (locked !== "OK") return null;

    const reminder = await this.findById(id);
    if (!reminder || reminder.status !== "PENDING") return null;

    await this.update(id, {
      status: "PROCESSING",
      attempts: reminder.attempts + 1,
      lastAttemptAt: attemptedAt,
      lastError: undefined,
    });

    return {
      ...reminder,
      status: "PROCESSING",
      attempts: reminder.attempts + 1,
      lastAttemptAt: attemptedAt,
      lastError: undefined,
      updatedAt: attemptedAt,
    };
  }

  async belongsToPatient(id: string, patientId: string): Promise<boolean> {
    const reminder = await this.findById(id);
    return reminder?.patientId === patientId;
  }

  private scheduledForScore(scheduledFor: string): number {
    const score = Date.parse(scheduledFor);
    if (Number.isNaN(score)) throw new Error("Reminder scheduledFor must be a valid date-time");
    return score;
  }

  private serialize(reminder: Reminder): Record<string, string> {
    const record: Record<string, string> = {
      id: reminder.id,
      patientId: reminder.patientId,
      source: reminder.source,
      sourceId: reminder.sourceId,
      targetDate: reminder.targetDate,
      scheduledFor: reminder.scheduledFor,
      timezone: reminder.timezone,
      channel: reminder.channel,
      status: reminder.status,
      attempts: String(reminder.attempts),
      maxAttempts: String(reminder.maxAttempts),
      createdAt: reminder.createdAt,
      updatedAt: reminder.updatedAt,
    };

    for (const field of optionalFields) {
      const value = reminder[field];
      if (value !== undefined) record[field] = value;
    }

    return record;
  }

  private requiredString(value: unknown): string {
    return typeof value === "string" ? value : String(value ?? "");
  }

  private optionalString(value: unknown): string | undefined {
    const normalized = this.requiredString(value);
    return normalized || undefined;
  }

  private requiredNumber(value: unknown): number {
    return typeof value === "number" ? value : Number(value);
  }

  private deserialize(data: Record<string, unknown>): Reminder {
    return reminderSchema.parse({
      id: this.requiredString(data.id),
      patientId: this.requiredString(data.patientId),
      source: this.requiredString(data.source),
      sourceId: this.requiredString(data.sourceId),
      targetDate: this.requiredString(data.targetDate),
      scheduledFor: this.requiredString(data.scheduledFor),
      timezone: this.requiredString(data.timezone),
      channel: this.requiredString(data.channel),
      status: this.requiredString(data.status),
      attempts: this.requiredNumber(data.attempts),
      maxAttempts: this.requiredNumber(data.maxAttempts),
      lastAttemptAt: this.optionalString(data.lastAttemptAt),
      processedAt: this.optionalString(data.processedAt),
      sentAt: this.optionalString(data.sentAt),
      completedAt: this.optionalString(data.completedAt),
      cancelledAt: this.optionalString(data.cancelledAt),
      lastError: this.optionalString(data.lastError),
      createdAt: this.requiredString(data.createdAt),
      updatedAt: this.requiredString(data.updatedAt),
    });
  }
}
