import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getServerEnv: vi.fn(),
}));

vi.mock("@/config/env", () => ({
  getServerEnv: mocks.getServerEnv,
}));

import { redisKeys } from "@/lib/redis/keys";

describe("finding Redis keys", () => {
  beforeEach(() => {
    mocks.getServerEnv.mockReturnValue({
      HEALTH_APP_REDIS_PREFIX: "bht:test",
    });
  });

  it("normalizes the prefix for finding keys", () => {
    expect(redisKeys.finding("finding-1")).toBe("bht:test:findings:finding-1");
    expect(redisKeys.findingsIndex()).toBe("bht:test:findings:index");
  });

  it("creates a study-date index scoped to one patient", () => {
    expect(redisKeys.patientFindingsByStudyDate("patient-1")).toBe(
      "bht:test:patients:patient-1:findings:study-date",
    );
  });
});
