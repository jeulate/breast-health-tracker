import { describe, expect, it } from "vitest";
import { buildReportHref } from "@/features/reports/report-filter-url";

describe("buildReportHref", () => {
  it("includes the required date range", () => {
    expect(buildReportHref({ from: "2026-07-01", to: "2026-07-31" })).toBe(
      "/dashboard/reports?from=2026-07-01&to=2026-07-31",
    );
  });
  it("includes optional patient filters", () => {
    expect(
      buildReportHref({
        from: "2026-07-01",
        to: "2026-07-31",
        patientId: "patient 1",
        patientStatus: "ACTIVE",
      }),
    ).toBe(
      "/dashboard/reports?from=2026-07-01&to=2026-07-31&patientId=patient+1&patientStatus=ACTIVE",
    );
  });
  it("omits empty optional filters", () => {
    expect(
      buildReportHref({
        from: "2026-07-01",
        to: "2026-07-31",
        patientId: undefined,
        patientStatus: undefined,
      }),
    ).not.toContain("patient");
  });
});
