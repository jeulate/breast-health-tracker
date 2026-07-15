import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Finding } from "@/features/findings";

const mocks = vi.hoisted(() => {
  const pipeline = {
    hset: vi.fn(),
    hdel: vi.fn(),
    sadd: vi.fn(),
    zadd: vi.fn(),
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

import { FindingRepository } from "@/repositories/finding.repository";

const finding: Finding = {
  id: "finding-1",
  patientId: "patient-1",
  category: "4A",
  laterality: "LEFT",
  studyType: "MAMMOGRAPHY",
  studyDate: "2026-07-10",
  description: "Hallazgo registrado desde un informe profesional.",
  observations: "Control registrado.",
  biopsyPerformed: false,
  nextControlDate: "2027-01-10",
  status: "FOLLOW_UP",
  createdAt: "2026-07-11T12:00:00.000Z",
  updatedAt: "2026-07-11T12:00:00.000Z",
};

function serializedFinding(value: Finding): Record<string, unknown> {
  return {
    id: value.id,
    patientId: value.patientId,
    category: value.category,
    laterality: value.laterality,
    studyType: value.studyType,
    studyDate: value.studyDate,
    description: value.description,
    observations: value.observations ?? "",
    biopsyPerformed: String(value.biopsyPerformed),
    biopsyResult: value.biopsyResult ?? "",
    nextControlDate: value.nextControlDate ?? "",
    status: value.status,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  };
}

describe("FindingRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.pipeline.exec.mockResolvedValue([]);
  });

  it("saves a finding and its indexes in one pipeline", async () => {
    await new FindingRepository().save(finding);

    expect(mocks.pipeline.hset).toHaveBeenCalledWith(
      "bht:test:findings:finding-1",
      expect.objectContaining({
        id: "finding-1",
        patientId: "patient-1",
        category: "BI-RADS:4A",
      }),
    );
    expect(mocks.pipeline.sadd).toHaveBeenCalledWith("bht:test:findings:index", "finding-1");
    expect(mocks.pipeline.zadd).toHaveBeenCalledWith(
      "bht:test:patients:patient-1:findings:study-date",
      {
        score: Date.parse("2026-07-10T00:00:00.000Z"),
        member: "finding-1",
      },
    );
    expect(mocks.pipeline.exec).toHaveBeenCalledOnce();
  });

  it("deserializes a finding", async () => {
    mocks.redis.hgetall.mockResolvedValue(serializedFinding(finding));

    await expect(new FindingRepository().findById("finding-1")).resolves.toEqual(finding);
  });

  it("normalizes numeric categories deserialized by Upstash", async () => {
    mocks.redis.hgetall.mockResolvedValue({
      ...serializedFinding({ ...finding, category: "3" }),
      category: 3,
      biopsyPerformed: false,
    });

    const result = await new FindingRepository().findById("finding-1");

    expect(result?.category).toBe("3");
    expect(typeof result?.category).toBe("string");
    expect(result?.biopsyPerformed).toBe(false);
  });

  it("lists only findings that belong to the requested patient", async () => {
    const foreignFinding = { ...finding, id: "finding-2", patientId: "patient-2" };
    mocks.redis.zrange.mockResolvedValue(["finding-1", "finding-2", "missing"]);
    mocks.redis.hgetall.mockImplementation(async (key: string) => {
      if (key.endsWith("finding-1")) return serializedFinding(finding);
      if (key.endsWith("finding-2")) return serializedFinding(foreignFinding);
      return null;
    });

    const result = await new FindingRepository().listByPatient("patient-1");

    expect(mocks.redis.zrange).toHaveBeenCalledWith(
      "bht:test:patients:patient-1:findings:study-date",
      0,
      -1,
      { rev: true },
    );
    expect(result).toEqual([finding]);
  });

  it("clears optional fields and refreshes the date index", async () => {
    mocks.redis.hgetall.mockResolvedValue(serializedFinding(finding));

    await new FindingRepository().update("finding-1", {
      studyDate: "2026-07-12",
      observations: undefined,
      nextControlDate: undefined,
    });

    expect(mocks.pipeline.hdel).toHaveBeenCalledWith(
      "bht:test:findings:finding-1",
      "observations",
      "nextControlDate",
    );
    expect(mocks.pipeline.zadd).toHaveBeenCalledWith(
      "bht:test:patients:patient-1:findings:study-date",
      {
        score: Date.parse("2026-07-12T00:00:00.000Z"),
        member: "finding-1",
      },
    );
  });

  it("checks patient ownership", async () => {
    mocks.redis.hgetall.mockResolvedValue(serializedFinding(finding));

    const repository = new FindingRepository();

    await expect(repository.belongsToPatient("finding-1", "patient-1")).resolves.toBe(true);
    await expect(repository.belongsToPatient("finding-1", "patient-2")).resolves.toBe(false);
  });
});
