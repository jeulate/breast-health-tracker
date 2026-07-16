import { describe, expect, it } from "vitest";
import { calendarRangeSchema } from "@/lib/validations/calendar";

describe("calendar range validation", () => {
  it("accepts a valid range and applies the default status", () => {
    expect(calendarRangeSchema.parse({ from: "2026-08-01", to: "2026-08-31" })).toEqual({
      from: "2026-08-01",
      to: "2026-08-31",
      status: "ALL",
    });
  });

  it("accepts an available status filter", () => {
    expect(
      calendarRangeSchema.parse({
        from: "2026-08-01",
        to: "2026-08-31",
        status: "SCHEDULED",
      }).status,
    ).toBe("SCHEDULED");
  });

  it("rejects impossible dates", () => {
    expect(calendarRangeSchema.safeParse({ from: "2026-02-30", to: "2026-08-31" }).success).toBe(
      false,
    );
  });

  it("rejects a reversed range", () => {
    expect(calendarRangeSchema.safeParse({ from: "2026-09-01", to: "2026-08-31" }).success).toBe(
      false,
    );
  });

  it("rejects ranges longer than 366 days", () => {
    expect(calendarRangeSchema.safeParse({ from: "2026-01-01", to: "2027-01-03" }).success).toBe(
      false,
    );
  });

  it("rejects unknown fields and statuses", () => {
    expect(
      calendarRangeSchema.safeParse({
        from: "2026-08-01",
        to: "2026-08-31",
        status: "RECORDED",
        patientId: "not-allowed",
      }).success,
    ).toBe(false);
  });
});
