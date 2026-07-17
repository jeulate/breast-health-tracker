import { describe, expect, it } from "vitest";
import { canTransitionReminder } from "@/features/reminders";

describe("reminder state transitions", () => {
  it.each([
    ["PENDING", "PROCESSING"],
    ["PENDING", "COMPLETED"],
    ["PENDING", "CANCELLED"],
    ["PROCESSING", "PENDING"],
    ["PROCESSING", "SENT"],
    ["PROCESSING", "FAILED"],
    ["SENT", "COMPLETED"],
    ["FAILED", "PENDING"],
    ["FAILED", "CANCELLED"],
  ] as const)("allows %s to transition to %s", (current, next) => {
    expect(canTransitionReminder(current, next)).toBe(true);
  });

  it.each([
    ["PENDING", "SENT"],
    ["SENT", "PENDING"],
    ["COMPLETED", "PENDING"],
    ["CANCELLED", "PENDING"],
    ["FAILED", "SENT"],
  ] as const)("rejects %s to %s", (current, next) => {
    expect(canTransitionReminder(current, next)).toBe(false);
  });
});
