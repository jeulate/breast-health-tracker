import { describe, expect, it } from "vitest";
import { reportFiltersSchema } from "@/lib/validations/report";

describe("report filters validation", () => {
  it("accepts a valid period without optional filters", () => {
    expect(reportFiltersSchema.parse({ from: "2026-07-01", to: "2026-07-31" })).toEqual({
      from: "2026-07-01",
      to: "2026-07-31",
    });
  });

  it("accepts patient and status filters", () => {
    expect(
      reportFiltersSchema.parse({
        from: "2026-07-01",
        to: "2026-07-31",
        patientId: "patient-1",
        patientStatus: "ACTIVE",
      }),
    ).toEqual({
      from: "2026-07-01",
      to: "2026-07-31",
      patientId: "patient-1",
      patientStatus: "ACTIVE",
    });
  });

  it("rejects missing dates and invalid formats", () => {
    expect(reportFiltersSchema.safeParse({}).success).toBe(false);
    expect(reportFiltersSchema.safeParse({ from: "01/07/2026", to: "2026-07-31" }).success).toBe(
      false,
    );
  });

  it("rejects a reversed period", () => {
    expect(reportFiltersSchema.safeParse({ from: "2026-08-01", to: "2026-07-31" }).success).toBe(
      false,
    );
  });

  it("rejects an empty patient and an unknown status", () => {
    expect(
      reportFiltersSchema.safeParse({
        from: "2026-07-01",
        to: "2026-07-31",
        patientId: " ",
      }).success,
    ).toBe(false);
    expect(
      reportFiltersSchema.safeParse({
        from: "2026-07-01",
        to: "2026-07-31",
        patientStatus: "ARCHIVED",
      }).success,
    ).toBe(false);
  });
});
