import type { Redis } from "@upstash/redis";
import type { TelegramLinkChallenge, TelegramLinkStatus } from "@/features/telegram";
import { getRedisClient } from "@/lib/redis/client";
import { redisKeys } from "@/lib/redis/keys";
import { telegramLinkChallengeSchema } from "@/lib/validations/telegram";

export interface TelegramChallengeUpdateFields {
  status?: TelegramLinkStatus;
  consumedAt?: string;
  revokedAt?: string;
}

export class TelegramLinkRepository {
  private get redis(): Redis {
    return getRedisClient();
  }

  async saveChallenge(challenge: TelegramLinkChallenge, ttlSeconds: number): Promise<void> {
    const parsed = telegramLinkChallengeSchema.parse(challenge);
    const key = redisKeys.telegramLinkChallenge(parsed.id);
    const pipeline = this.redis.pipeline();

    pipeline.hset(key, this.serialize(parsed));
    pipeline.expire(key, ttlSeconds);
    pipeline.set(redisKeys.telegramLinkChallengeByTokenHash(parsed.tokenHash), parsed.id, {
      ex: ttlSeconds,
    });
    await pipeline.exec();
  }

  async findChallengeById(id: string): Promise<TelegramLinkChallenge | null> {
    const data = await this.redis.hgetall<Record<string, unknown>>(
      redisKeys.telegramLinkChallenge(id),
    );
    if (!data || Object.keys(data).length === 0) return null;
    return this.deserialize(data);
  }

  async findChallengeByTokenHash(tokenHash: string): Promise<TelegramLinkChallenge | null> {
    const id = await this.redis.get<string>(redisKeys.telegramLinkChallengeByTokenHash(tokenHash));
    return id ? this.findChallengeById(id) : null;
  }

  async updateChallenge(id: string, fields: TelegramChallengeUpdateFields): Promise<void> {
    const values: Record<string, string> = { updatedAt: new Date().toISOString() };
    if (fields.status !== undefined) values.status = fields.status;
    if (fields.consumedAt !== undefined) values.consumedAt = fields.consumedAt;
    if (fields.revokedAt !== undefined) values.revokedAt = fields.revokedAt;
    await this.redis.hset(redisKeys.telegramLinkChallenge(id), values);
  }

  async claimChat(chatId: string, patientId: string): Promise<boolean> {
    const key = redisKeys.telegramPatientByChatId(chatId);
    const claimed = await this.redis.set(key, patientId, { nx: true });
    if (claimed === "OK") return true;
    return (await this.redis.get<string>(key)) === patientId;
  }

  async findPatientIdByChatId(chatId: string): Promise<string | null> {
    return (await this.redis.get<string>(redisKeys.telegramPatientByChatId(chatId))) ?? null;
  }

  async releaseChat(chatId: string, patientId: string): Promise<boolean> {
    const key = redisKeys.telegramPatientByChatId(chatId);
    const owner = await this.redis.get<string>(key);
    if (owner !== patientId) return false;
    await this.redis.del(key);
    return true;
  }

  private serialize(challenge: TelegramLinkChallenge): Record<string, string> {
    const record: Record<string, string> = {
      id: challenge.id,
      patientId: challenge.patientId,
      tokenHash: challenge.tokenHash,
      status: challenge.status,
      expiresAt: challenge.expiresAt,
      createdAt: challenge.createdAt,
      updatedAt: challenge.updatedAt,
    };
    if (challenge.consumedAt) record.consumedAt = challenge.consumedAt;
    if (challenge.revokedAt) record.revokedAt = challenge.revokedAt;
    return record;
  }

  private deserialize(data: Record<string, unknown>): TelegramLinkChallenge {
    const value = (field: string): string | undefined => {
      const raw = data[field];
      if (raw === undefined || raw === null || raw === "") return undefined;
      return typeof raw === "string" ? raw : String(raw);
    };

    return telegramLinkChallengeSchema.parse({
      id: value("id"),
      patientId: value("patientId"),
      tokenHash: value("tokenHash"),
      status: value("status"),
      expiresAt: value("expiresAt"),
      consumedAt: value("consumedAt"),
      revokedAt: value("revokedAt"),
      createdAt: value("createdAt"),
      updatedAt: value("updatedAt"),
    });
  }
}
