import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ClinicalEvent } from "@/features/clinical-timeline";

const mocks = vi.hoisted(() => {
  const pipeline = {
    hset: vi.fn(),
    hdel: vi.fn(),
    sadd: vi.fn(),
    srem: vi.fn(),
    zadd: vi.fn(),
    zrem: vi.fn(),
    del: vi.fn(),
    exec: vi.fn(),
  };

  return {
    pipeline,
    redis: {
      hgetall: vi.fn(),
      zrange: vi.fn(),
      zcard: vi.fn(),
      pipeline: vi.fn(() => pipeline),
    },
  };
});

vi.mock("@/lib/redis/client", () => ({
  getRedisClient: () => mocks.redis,
}));

vi.mock("@/config/env", () => ({
  getServerEnv: () => ({ HEALTH_APP_REDIS_PREFIX: "bht:test:" }),
}));

import { ClinicalEventRepository } from "@/repositories/clinical-event.repository";

const event: ClinicalEvent = {
  id: "event-1",
  patientId: "patient-1",
  type: "CONTROL",
  eventDate: "2026-07-10",
  title: "Control completado",
  description: "Control registrado según la información profesional.",
  status: "COMPLETED",
  findingId: "b19b019a-5a0f-41f3-9ba1-a6f191462bc0",
  createdAt: "2026-07-11T12:00:00.000Z",
  updatedAt: "2026-07-11T12:00:00.000Z",
};

function serializedEvent(value: ClinicalEvent): Record<string, unknown> {
  return {
    id: value.id,
    patientId: value.patientId,
    type: value.type,
    eventDate: value.eventDate,
    title: value.title,
    description: value.description,
    status: value.status,
    findingId: value.findingId ?? "",
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  };
}

describe("ClinicalEventRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.pipeline.exec.mockResolvedValue([]);
  });

  it("saves an event and its indexes in one pipeline", async () => {
    await new ClinicalEventRepository().save(event);

    expect(mocks.pipeline.hset).toHaveBeenCalledWith(
      "bht:test:clinical-events:event-1",
      expect.objectContaining({
        id: "event-1",
        patientId: "patient-1",
        type: "CONTROL",
      }),
    );
    expect(mocks.pipeline.sadd).toHaveBeenCalledWith("bht:test:clinical-events:index", "event-1");
    expect(mocks.pipeline.zadd).toHaveBeenCalledWith(
      "bht:test:patients:patient-1:clinical-events:event-date",
      {
        score: Date.parse("2026-07-10T00:00:00.000Z"),
        member: "event-1",
      },
    );
    expect(mocks.pipeline.exec).toHaveBeenCalledOnce();
  });

  it("deserializes an event", async () => {
    mocks.redis.hgetall.mockResolvedValue(serializedEvent(event));

    await expect(new ClinicalEventRepository().findById("event-1")).resolves.toEqual(event);
  });

  it("lists only events belonging to the requested patient", async () => {
    const foreignEvent = { ...event, id: "event-2", patientId: "patient-2" };
    mocks.redis.zrange.mockResolvedValue(["event-1", "event-2", "missing"]);
    mocks.redis.hgetall.mockImplementation(async (key: string) => {
      if (key.endsWith("event-1")) return serializedEvent(event);
      if (key.endsWith("event-2")) return serializedEvent(foreignEvent);
      return null;
    });

    const result = await new ClinicalEventRepository().listByPatient("patient-1");

    expect(mocks.redis.zrange).toHaveBeenCalledWith(
      "bht:test:patients:patient-1:clinical-events:event-date",
      0,
      -1,
      { rev: true },
    );
    expect(result).toEqual([event]);
  });

  it("clears the finding relation and refreshes the date index", async () => {
    mocks.redis.hgetall.mockResolvedValue(serializedEvent(event));

    await new ClinicalEventRepository().update("event-1", {
      eventDate: "2026-07-12",
      findingId: undefined,
    });

    expect(mocks.pipeline.hdel).toHaveBeenCalledWith(
      "bht:test:clinical-events:event-1",
      "findingId",
    );
    expect(mocks.pipeline.zadd).toHaveBeenCalledWith(
      "bht:test:patients:patient-1:clinical-events:event-date",
      {
        score: Date.parse("2026-07-12T00:00:00.000Z"),
        member: "event-1",
      },
    );
  });

  it("deletes the event and both indexes in one pipeline", async () => {
    mocks.redis.hgetall.mockResolvedValue(serializedEvent(event));

    await new ClinicalEventRepository().delete("event-1");

    expect(mocks.pipeline.del).toHaveBeenCalledWith("bht:test:clinical-events:event-1");
    expect(mocks.pipeline.srem).toHaveBeenCalledWith("bht:test:clinical-events:index", "event-1");
    expect(mocks.pipeline.zrem).toHaveBeenCalledWith(
      "bht:test:patients:patient-1:clinical-events:event-date",
      "event-1",
    );
    expect(mocks.pipeline.exec).toHaveBeenCalledOnce();
  });

  it("does not write when updating or deleting a missing event", async () => {
    mocks.redis.hgetall.mockResolvedValue(null);
    const repository = new ClinicalEventRepository();

    await repository.update("missing", { title: "Título actualizado" });
    await repository.delete("missing");

    expect(mocks.redis.pipeline).not.toHaveBeenCalled();
  });

  it("counts events and checks patient ownership", async () => {
    mocks.redis.zcard.mockResolvedValue(2);
    mocks.redis.hgetall.mockResolvedValue(serializedEvent(event));
    const repository = new ClinicalEventRepository();

    await expect(repository.countByPatient("patient-1")).resolves.toBe(2);
    await expect(repository.belongsToPatient("event-1", "patient-1")).resolves.toBe(true);
    await expect(repository.belongsToPatient("event-1", "patient-2")).resolves.toBe(false);
  });
});
