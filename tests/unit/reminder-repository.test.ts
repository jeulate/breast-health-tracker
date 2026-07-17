import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Reminder } from "@/features/reminders";

const mocks = vi.hoisted(() => {
  const pipeline = {
    hset: vi.fn(),
    hdel: vi.fn(),
    sadd: vi.fn(),
    srem: vi.fn(),
    zadd: vi.fn(),
    exec: vi.fn(),
  };

  return {
    pipeline,
    redis: {
      hgetall: vi.fn(),
      zrange: vi.fn(),
      pipeline: vi.fn(() => pipeline),
    },
  };
});

vi.mock("@/lib/redis/client", () => ({ getRedisClient: () => mocks.redis }));
vi.mock("@/config/env", () => ({
  getServerEnv: () => ({ HEALTH_APP_REDIS_PREFIX: "bht:test:" }),
}));

import { ReminderRepository } from "@/repositories/reminder.repository";

const reminder: Reminder = {
  id: "rem_0123456789abcdef0123456789abcdef",
  patientId: "45ae0fb2-dfd0-49a6-a426-eb492bcbad46",
  source: "CLINICAL_EVENT",
  sourceId: "9d1138d8-89b7-47ba-a570-a0a92cc0a850",
  targetDate: "2026-07-25",
  scheduledFor: "2026-07-24T13:00:00.000Z",
  timezone: "America/La_Paz",
  channel: "IN_APP",
  status: "PENDING",
  attempts: 0,
  maxAttempts: 3,
  createdAt: "2026-07-17T15:00:00.000Z",
  updatedAt: "2026-07-17T15:00:00.000Z",
};

function serialized(value: Reminder): Record<string, unknown> {
  return {
    id: value.id,
    patientId: value.patientId,
    source: value.source,
    sourceId: value.sourceId,
    targetDate: value.targetDate,
    scheduledFor: value.scheduledFor,
    timezone: value.timezone,
    channel: value.channel,
    status: value.status,
    attempts: String(value.attempts),
    maxAttempts: String(value.maxAttempts),
    lastAttemptAt: value.lastAttemptAt ?? "",
    sentAt: value.sentAt ?? "",
    completedAt: value.completedAt ?? "",
    cancelledAt: value.cancelledAt ?? "",
    lastError: value.lastError ?? "",
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  };
}

describe("ReminderRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.pipeline.exec.mockResolvedValue([]);
  });

  it("saves a reminder and all indexes in one pipeline", async () => {
    await new ReminderRepository().save(reminder);
    const score = Date.parse(reminder.scheduledFor);

    expect(mocks.pipeline.hset).toHaveBeenCalledWith(
      `bht:test:reminders:${reminder.id}`,
      expect.objectContaining({ status: "PENDING", attempts: "0" }),
    );
    expect(mocks.pipeline.sadd).toHaveBeenCalledWith("bht:test:reminders:index", reminder.id);
    expect(mocks.pipeline.sadd).toHaveBeenCalledWith(
      "bht:test:reminders:status:PENDING",
      reminder.id,
    );
    expect(mocks.pipeline.zadd).toHaveBeenCalledWith("bht:test:reminders:scheduled-for", {
      score,
      member: reminder.id,
    });
    expect(mocks.pipeline.zadd).toHaveBeenCalledWith(
      `bht:test:patients:${reminder.patientId}:reminders:scheduled-for`,
      { score, member: reminder.id },
    );
    expect(mocks.pipeline.exec).toHaveBeenCalledOnce();
  });

  it("deserializes numeric values returned by Upstash", async () => {
    mocks.redis.hgetall.mockResolvedValue({
      ...serialized(reminder),
      attempts: 0,
      maxAttempts: 3,
    });

    await expect(new ReminderRepository().findById(reminder.id)).resolves.toEqual(reminder);
  });

  it("lists only reminders owned by the requested patient", async () => {
    const foreign = {
      ...reminder,
      id: "rem_abcdef0123456789abcdef0123456789",
      patientId: "6cc1432f-67d4-445d-ad18-0ca3816d369f",
    };
    mocks.redis.zrange.mockResolvedValue([reminder.id, foreign.id]);
    mocks.redis.hgetall.mockImplementation(async (key: string) =>
      key.endsWith(reminder.id) ? serialized(reminder) : serialized(foreign),
    );

    await expect(new ReminderRepository().listByPatient(reminder.patientId)).resolves.toEqual([
      reminder,
    ]);
    expect(mocks.redis.zrange).toHaveBeenCalledWith(
      `bht:test:patients:${reminder.patientId}:reminders:scheduled-for`,
      0,
      -1,
      { rev: false },
    );
  });

  it("returns only pending due reminders and respects the limit", async () => {
    const sent: Reminder = {
      ...reminder,
      id: "rem_abcdef0123456789abcdef0123456789",
      status: "SENT",
      sentAt: "2026-07-24T13:01:00.000Z",
    };
    mocks.redis.zrange.mockResolvedValue([reminder.id, sent.id, "ignored-by-limit"]);
    mocks.redis.hgetall.mockImplementation(async (key: string) =>
      key.endsWith(reminder.id) ? serialized(reminder) : serialized(sent),
    );

    await expect(new ReminderRepository().listDue("2026-07-24T14:00:00.000Z", 2)).resolves.toEqual([
      reminder,
    ]);
    expect(mocks.redis.zrange).toHaveBeenCalledWith(
      "bht:test:reminders:scheduled-for",
      0,
      Date.parse("2026-07-24T14:00:00.000Z"),
      { byScore: true },
    );
  });

  it("moves a reminder between status indexes", async () => {
    mocks.redis.hgetall.mockResolvedValue(serialized(reminder));
    const sentAt = "2026-07-24T13:01:00.000Z";

    await new ReminderRepository().update(reminder.id, {
      status: "SENT",
      attempts: 1,
      lastAttemptAt: sentAt,
      sentAt,
    });

    expect(mocks.pipeline.srem).toHaveBeenCalledWith(
      "bht:test:reminders:status:PENDING",
      reminder.id,
    );
    expect(mocks.pipeline.sadd).toHaveBeenCalledWith("bht:test:reminders:status:SENT", reminder.id);
    expect(mocks.pipeline.hset).toHaveBeenCalledWith(
      `bht:test:reminders:${reminder.id}`,
      expect.objectContaining({ status: "SENT", attempts: "1", sentAt }),
    );
  });

  it("clears optional execution metadata", async () => {
    mocks.redis.hgetall.mockResolvedValue(serialized(reminder));

    await new ReminderRepository().update(reminder.id, {
      lastAttemptAt: undefined,
      lastError: undefined,
    });

    expect(mocks.pipeline.hdel).toHaveBeenCalledWith(
      `bht:test:reminders:${reminder.id}`,
      "lastAttemptAt",
      "lastError",
    );
  });

  it("checks patient ownership", async () => {
    mocks.redis.hgetall.mockResolvedValue(serialized(reminder));
    const repository = new ReminderRepository();

    await expect(repository.belongsToPatient(reminder.id, reminder.patientId)).resolves.toBe(true);
    await expect(repository.belongsToPatient(reminder.id, "another-patient")).resolves.toBe(false);
  });
});
