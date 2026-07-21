import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getServerEnv: vi.fn(),
}));

vi.mock("@/config/env", () => ({
  getServerEnv: mocks.getServerEnv,
}));

import { redisKeys } from "@/lib/redis/keys";

describe("Redis keys", () => {
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

  it("creates clinical event keys with the normalized prefix", () => {
    expect(redisKeys.clinicalEvent("event-1")).toBe("bht:test:clinical-events:event-1");
    expect(redisKeys.clinicalEventsIndex()).toBe("bht:test:clinical-events:index");
  });

  it("creates an event-date index scoped to one patient", () => {
    expect(redisKeys.patientClinicalEventsByEventDate("patient-1")).toBe(
      "bht:test:patients:patient-1:clinical-events:event-date",
    );
  });

  it("creates a processing lock scoped to one reminder", () => {
    expect(redisKeys.reminderProcessingLock("reminder-1")).toBe(
      "bht:test:reminders:reminder-1:processing-lock",
    );
  });

  it("creates Telegram link keys without exposing a raw token", () => {
    expect(redisKeys.telegramLinkChallenge("tgl_abc")).toBe(
      "bht:test:telegram:link-challenges:tgl_abc",
    );
    expect(redisKeys.telegramLinkChallengeByTokenHash("hash-1")).toBe(
      "bht:test:telegram:link-challenges:token:hash-1",
    );
    expect(redisKeys.telegramPatientByChatId("123456")).toBe(
      "bht:test:telegram:chats:123456:patient",
    );
  });
});
