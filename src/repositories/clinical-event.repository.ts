import type { Redis } from "@upstash/redis";
import type { ClinicalEvent } from "@/features/clinical-timeline";
import type { UpdateClinicalEventInput } from "@/lib/validations/clinical-event";
import { getRedisClient } from "@/lib/redis/client";
import { redisKeys } from "@/lib/redis/keys";

export type ClinicalEventSortDirection = "asc" | "desc";

export class ClinicalEventRepository {
  private get redis(): Redis {
    return getRedisClient();
  }

  private key(id: string): string {
    return redisKeys.clinicalEvent(id);
  }

  async findById(id: string): Promise<ClinicalEvent | null> {
    const data = await this.redis.hgetall<Record<string, unknown>>(this.key(id));

    if (!data || Object.keys(data).length === 0) return null;

    return this.deserialize(data);
  }

  async save(event: ClinicalEvent): Promise<void> {
    const pipeline = this.redis.pipeline();

    pipeline.hset(this.key(event.id), this.serialize(event));
    pipeline.sadd(redisKeys.clinicalEventsIndex(), event.id);
    pipeline.zadd(redisKeys.patientClinicalEventsByEventDate(event.patientId), {
      score: this.eventDateScore(event.eventDate),
      member: event.id,
    });

    await pipeline.exec();
  }

  async update(id: string, fields: UpdateClinicalEventInput): Promise<void> {
    const existing = await this.findById(id);

    if (!existing) return;

    const pipeline = this.redis.pipeline();
    const values: Record<string, string> = { updatedAt: new Date().toISOString() };

    if (fields.type !== undefined) values.type = fields.type;
    if (fields.eventDate !== undefined) values.eventDate = fields.eventDate;
    if (fields.title !== undefined) values.title = fields.title;
    if (fields.description !== undefined) values.description = fields.description;
    if (fields.status !== undefined) values.status = fields.status;

    pipeline.hset(this.key(id), values);

    if (Object.prototype.hasOwnProperty.call(fields, "findingId")) {
      if (fields.findingId === undefined) {
        pipeline.hdel(this.key(id), "findingId");
      } else {
        pipeline.hset(this.key(id), { findingId: fields.findingId });
      }
    }

    if (fields.eventDate !== undefined) {
      pipeline.zadd(redisKeys.patientClinicalEventsByEventDate(existing.patientId), {
        score: this.eventDateScore(fields.eventDate),
        member: id,
      });
    }

    await pipeline.exec();
  }

  async delete(id: string): Promise<void> {
    const existing = await this.findById(id);

    if (!existing) return;

    const pipeline = this.redis.pipeline();

    pipeline.del(this.key(id));
    pipeline.srem(redisKeys.clinicalEventsIndex(), id);
    pipeline.zrem(redisKeys.patientClinicalEventsByEventDate(existing.patientId), id);

    await pipeline.exec();
  }

  async listByPatient(
    patientId: string,
    direction: ClinicalEventSortDirection = "desc",
  ): Promise<ClinicalEvent[]> {
    const ids = (await this.redis.zrange(
      redisKeys.patientClinicalEventsByEventDate(patientId),
      0,
      -1,
      { rev: direction === "desc" },
    )) as string[];

    if (ids.length === 0) return [];

    const events = await Promise.all(ids.map((id) => this.findById(id)));

    return events.filter(
      (event): event is ClinicalEvent => event !== null && event.patientId === patientId,
    );
  }

  async countByPatient(patientId: string): Promise<number> {
    return this.redis.zcard(redisKeys.patientClinicalEventsByEventDate(patientId));
  }

  async belongsToPatient(id: string, patientId: string): Promise<boolean> {
    const event = await this.findById(id);
    return event?.patientId === patientId;
  }

  private eventDateScore(eventDate: string): number {
    const score = Date.parse(`${eventDate}T00:00:00.000Z`);

    if (Number.isNaN(score)) {
      throw new Error("Clinical event eventDate must be a valid date");
    }

    return score;
  }

  private serialize(event: ClinicalEvent): Record<string, string> {
    const record: Record<string, string> = {
      id: event.id,
      patientId: event.patientId,
      type: event.type,
      eventDate: event.eventDate,
      title: event.title,
      description: event.description,
      status: event.status,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
    };

    if (event.findingId) record.findingId = event.findingId;

    return record;
  }

  private requiredString(value: unknown): string {
    return typeof value === "string" ? value : String(value ?? "");
  }

  private optionalString(value: unknown): string | undefined {
    const normalized = this.requiredString(value);
    return normalized || undefined;
  }

  private deserialize(data: Record<string, unknown>): ClinicalEvent {
    return {
      id: this.requiredString(data.id),
      patientId: this.requiredString(data.patientId),
      type: this.requiredString(data.type) as ClinicalEvent["type"],
      eventDate: this.requiredString(data.eventDate),
      title: this.requiredString(data.title),
      description: this.requiredString(data.description),
      status: this.requiredString(data.status) as ClinicalEvent["status"],
      findingId: this.optionalString(data.findingId),
      createdAt: this.requiredString(data.createdAt),
      updatedAt: this.requiredString(data.updatedAt),
    };
  }
}
