import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TelegramLinkChallenge } from "@/features/telegram";

const mocks = vi.hoisted(() => {
  const pipeline = {
    hset: vi.fn(),
    expire: vi.fn(),
    set: vi.fn(),
    exec: vi.fn(),
  };
  return {
    pipeline,
    redis: {
      pipeline: vi.fn(() => pipeline),
      hgetall: vi.fn(),
      hset: vi.fn(),
      get: vi.fn(),
      set: vi.fn(),
      del: vi.fn(),
    },
  };
});

vi.mock("@/lib/redis/client", () => ({ getRedisClient: () => mocks.redis }));
vi.mock("@/config/env", () => ({
  getServerEnv: () => ({ HEALTH_APP_REDIS_PREFIX: "bht:test:" }),
}));

import { TelegramLinkRepository } from "@/repositories/telegram-link.repository";

const challenge: TelegramLinkChallenge = {
  id: "tgl_0123456789abcdef0123456789abcdef",
  patientId: "45ae0fb2-dfd0-49a6-a426-eb492bcbad46",
  tokenHash: "a".repeat(64),
  status: "PENDING",
  expiresAt: "2026-07-20T15:15:00.000Z",
  createdAt: "2026-07-20T15:00:00.000Z",
  updatedAt: "2026-07-20T15:00:00.000Z",
};

describe("TelegramLinkRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.pipeline.exec.mockResolvedValue([]);
  });

  it("stores only the token hash and applies TTL to both lookup keys", async () => {
    await new TelegramLinkRepository().saveChallenge(challenge, 900);

    expect(mocks.pipeline.hset).toHaveBeenCalledWith(
      `bht:test:telegram:link-challenges:${challenge.id}`,
      expect.objectContaining({ tokenHash: challenge.tokenHash, status: "PENDING" }),
    );
    expect(mocks.pipeline.expire).toHaveBeenCalledWith(
      `bht:test:telegram:link-challenges:${challenge.id}`,
      900,
    );
    expect(mocks.pipeline.set).toHaveBeenCalledWith(
      `bht:test:telegram:link-challenges:token:${challenge.tokenHash}`,
      challenge.id,
      { ex: 900 },
    );
  });

  it("resolves a challenge through its token hash", async () => {
    mocks.redis.get.mockResolvedValue(challenge.id);
    mocks.redis.hgetall.mockResolvedValue(challenge);

    await expect(
      new TelegramLinkRepository().findChallengeByTokenHash(challenge.tokenHash),
    ).resolves.toEqual(challenge);
  });

  it("claims a chat once and accepts the same patient idempotently", async () => {
    mocks.redis.set.mockResolvedValueOnce("OK");
    const repository = new TelegramLinkRepository();
    await expect(repository.claimChat("123", challenge.patientId)).resolves.toBe(true);

    mocks.redis.set.mockResolvedValueOnce(null);
    mocks.redis.get.mockResolvedValueOnce(challenge.patientId);
    await expect(repository.claimChat("123", challenge.patientId)).resolves.toBe(true);
  });

  it("rejects a chat already owned by another patient", async () => {
    mocks.redis.set.mockResolvedValue(null);
    mocks.redis.get.mockResolvedValue("another-patient");
    await expect(new TelegramLinkRepository().claimChat("123", challenge.patientId)).resolves.toBe(
      false,
    );
  });

  it("releases a chat only for its current patient", async () => {
    const repository = new TelegramLinkRepository();
    mocks.redis.get.mockResolvedValueOnce("another-patient");
    await expect(repository.releaseChat("123", challenge.patientId)).resolves.toBe(false);

    mocks.redis.get.mockResolvedValueOnce(challenge.patientId);
    await expect(repository.releaseChat("123", challenge.patientId)).resolves.toBe(true);
    expect(mocks.redis.del).toHaveBeenCalledWith("bht:test:telegram:chats:123:patient");
  });
});
