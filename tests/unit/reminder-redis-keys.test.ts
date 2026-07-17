import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ getServerEnv: vi.fn() }));

vi.mock("@/config/env", () => ({ getServerEnv: mocks.getServerEnv }));

import { redisKeys } from "@/lib/redis/keys";

describe("reminder Redis keys", () => {
  beforeEach(() => {
    mocks.getServerEnv.mockReturnValue({ HEALTH_APP_REDIS_PREFIX: "bht:test" });
  });

  it("creates reminder entity and global index keys", () => {
    expect(redisKeys.reminder("reminder-1")).toBe("bht:test:reminders:reminder-1");
    expect(redisKeys.remindersIndex()).toBe("bht:test:reminders:index");
    expect(redisKeys.remindersByScheduledFor()).toBe("bht:test:reminders:scheduled-for");
  });

  it("creates a normalized status index", () => {
    expect(redisKeys.remindersByStatus("PENDING")).toBe("bht:test:reminders:status:PENDING");
  });

  it("creates a scheduled index scoped to one patient", () => {
    expect(redisKeys.patientRemindersByScheduledFor("patient-1")).toBe(
      "bht:test:patients:patient-1:reminders:scheduled-for",
    );
  });
});
