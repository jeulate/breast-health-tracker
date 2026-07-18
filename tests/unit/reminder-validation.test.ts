import { describe, expect, it } from "vitest";
import { createReminderSchema, reminderSchema } from "@/lib/validations/reminder";

const createInput = {
  patientId: "45ae0fb2-dfd0-49a6-a426-eb492bcbad46",
  source: "CLINICAL_EVENT" as const,
  sourceId: "9d1138d8-89b7-47ba-a570-a0a92cc0a850",
  targetDate: "2026-07-25",
  scheduledFor: "2026-07-24T09:00:00-04:00",
};

const storedReminder = {
  ...createReminderSchema.parse(createInput),
  id: "rem_0123456789abcdef0123456789abcdef",
  status: "PENDING" as const,
  attempts: 0,
  createdAt: "2026-07-17T15:00:00.000Z",
  updatedAt: "2026-07-17T15:00:00.000Z",
};

describe("reminder validation", () => {
  it("applies safe defaults to a valid reminder", () => {
    expect(createReminderSchema.parse(createInput)).toEqual({
      ...createInput,
      timezone: "America/La_Paz",
      channel: "IN_APP",
      maxAttempts: 3,
    });
  });

  it("accepts a valid IANA timezone", () => {
    const result = createReminderSchema.parse({ ...createInput, timezone: "America/Lima" });
    expect(result.timezone).toBe("America/Lima");
  });

  it("rejects an unknown timezone", () => {
    expect(() =>
      createReminderSchema.parse({ ...createInput, timezone: "America/Unknown" }),
    ).toThrow();
  });

  it("rejects impossible target dates", () => {
    expect(() =>
      createReminderSchema.parse({ ...createInput, targetDate: "2026-02-30" }),
    ).toThrow();
  });

  it("requires an ISO date-time with an explicit offset", () => {
    expect(() =>
      createReminderSchema.parse({ ...createInput, scheduledFor: "2026-07-24T09:00:00" }),
    ).toThrow();
  });

  it("rejects unknown fields", () => {
    expect(() => createReminderSchema.parse({ ...createInput, message: "extra" })).toThrow();
  });

  it("limits the number of attempts configured", () => {
    expect(() => createReminderSchema.parse({ ...createInput, maxAttempts: 11 })).toThrow();
  });

  it("accepts a valid pending stored reminder", () => {
    expect(reminderSchema.parse(storedReminder)).toEqual(storedReminder);
  });

  it("rejects attempts greater than the configured maximum", () => {
    expect(() =>
      reminderSchema.parse({ ...storedReminder, attempts: 4, maxAttempts: 3 }),
    ).toThrow();
  });

  it.each([
    ["PROCESSING", "lastAttemptAt"],
    ["SENT", "sentAt"],
    ["COMPLETED", "completedAt"],
    ["CANCELLED", "cancelledAt"],
    ["FAILED", "lastError"],
  ] as const)("requires %s metadata", (status, field) => {
    const result = reminderSchema.safeParse({ ...storedReminder, status });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path[0] === field)).toBe(true);
    }
  });

  it("accepts terminal and processing metadata", () => {
    const timestamp = "2026-07-17T16:00:00.000Z";

    expect(
      reminderSchema.parse({
        ...storedReminder,
        status: "SENT",
        attempts: 1,
        lastAttemptAt: timestamp,
        sentAt: timestamp,
      }).status,
    ).toBe("SENT");
  });

  it("limits stored error details", () => {
    expect(() =>
      reminderSchema.parse({
        ...storedReminder,
        status: "FAILED",
        lastError: "x".repeat(501),
      }),
    ).toThrow();
  });
});
