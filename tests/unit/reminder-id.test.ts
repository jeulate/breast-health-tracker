import { describe, expect, it } from "vitest";
import { buildReminderId } from "@/features/reminders";

const input = {
  source: "CLINICAL_EVENT" as const,
  sourceId: "9d1138d8-89b7-47ba-a570-a0a92cc0a850",
  scheduledFor: "2026-07-20T09:00:00-04:00",
  channel: "IN_APP" as const,
};

describe("buildReminderId", () => {
  it("generates a stable namespaced identifier", () => {
    const first = buildReminderId(input);
    const second = buildReminderId(input);

    expect(first).toBe(second);
    expect(first).toMatch(/^rem_[a-f0-9]{32}$/);
  });

  it("normalizes equivalent date-time offsets", () => {
    const first = buildReminderId(input);
    const second = buildReminderId({
      ...input,
      scheduledFor: "2026-07-20T13:00:00.000Z",
    });

    expect(first).toBe(second);
  });

  it.each([
    ["source", { ...input, source: "FINDING_NEXT_CONTROL" as const }],
    ["sourceId", { ...input, sourceId: "6cc1432f-67d4-445d-ad18-0ca3816d369f" }],
    ["scheduledFor", { ...input, scheduledFor: "2026-07-20T10:00:00-04:00" }],
  ])("changes when %s changes", (_field, candidate) => {
    expect(buildReminderId(candidate)).not.toBe(buildReminderId(input));
  });

  it("rejects an invalid scheduled date", () => {
    expect(() => buildReminderId({ ...input, scheduledFor: "invalid" })).toThrow(
      "scheduledFor must be a valid ISO date-time",
    );
  });
});
