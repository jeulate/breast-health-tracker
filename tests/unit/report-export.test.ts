import { describe, expect, it } from "vitest";
import {
  buildReportExportRows,
  buildReportExportUrl,
  buildReportFilename,
} from "@/features/reports/report-export";

const summary = {
  period: { from: "2026-07-01", to: "2026-07-31" },
  patients: { total: 2, active: 1, inactive: 1 },
  findings: { total: 1, followUp: 1, closed: 0 },
  clinicalEvents: { total: 2, scheduled: 1, completed: 1, cancelled: 0 },
  reminders: {
    total: 3,
    pending: 1,
    processing: 0,
    sent: 1,
    completed: 1,
    cancelled: 0,
    failed: 0,
  },
};

describe("report export helpers", () => {
  it("builds CSV and PDF URLs with all filters", () => {
    const filters = {
      from: "2026-07-01",
      to: "2026-07-31",
      patientId: "patient 1",
      patientStatus: "ACTIVE" as const,
    };
    expect(buildReportExportUrl(filters, "csv")).toBe(
      "/api/reports/export/csv?from=2026-07-01&to=2026-07-31&patientId=patient+1&patientStatus=ACTIVE",
    );
    expect(buildReportExportUrl(filters, "pdf")).toContain("/api/reports/export/pdf?");
  });

  it("creates a stable export filename", () => {
    expect(buildReportFilename("csv", summary)).toBe("reporte-2026-07-01-2026-07-31.csv");
  });

  it("maps all summary categories", () => {
    const rows = buildReportExportRows(summary);
    expect(rows).toHaveLength(4);
    expect(rows.map((row) => row.category)).toEqual([
      "Pacientes",
      "Hallazgos",
      "Seguimientos",
      "Recordatorios",
    ]);
  });
});
