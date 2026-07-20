import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const pipeline = { hdel: vi.fn(), hset: vi.fn(), exec: vi.fn() };
  return {
    pipeline,
    redis: {
      hset: vi.fn(),
      pipeline: vi.fn(() => pipeline),
    },
  };
});

vi.mock("@/lib/redis/client", () => ({ getRedisClient: () => mocks.redis }));
vi.mock("@/config/env", () => ({
  getServerEnv: () => ({ HEALTH_APP_REDIS_PREFIX: "bht:test:" }),
}));

import { PatientRepository } from "@/repositories/patient.repository";

describe("PatientRepository Telegram link", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.pipeline.exec.mockResolvedValue([]);
  });

  it("updates Telegram identifiers through an explicit method", async () => {
    await new PatientRepository().updateTelegramLink("patient-1", {
      telegramUserId: "123456",
      telegramChatId: "123456",
    });

    expect(mocks.redis.hset).toHaveBeenCalledWith(
      "bht:test:patients:patient-1",
      expect.objectContaining({ telegramUserId: "123456", telegramChatId: "123456" }),
    );
  });

  it("clears both identifiers in one pipeline", async () => {
    await new PatientRepository().clearTelegramLink("patient-1");

    expect(mocks.pipeline.hdel).toHaveBeenCalledWith(
      "bht:test:patients:patient-1",
      "telegramUserId",
      "telegramChatId",
    );
    expect(mocks.pipeline.exec).toHaveBeenCalledOnce();
  });
});
