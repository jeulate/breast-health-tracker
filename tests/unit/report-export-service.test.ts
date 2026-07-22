import { describe, expect, it } from "vitest";
import { ReportExportService } from "@/services/report-export.service";

const summary = {
  period: { from: "2026-07-01", to: "2026-07-31" },
  patients: { total: 1, active: 1, inactive: 0 },
  findings: { total: 1, followUp: 1, closed: 0 },
  clinicalEvents: { total: 0, scheduled: 0, completed: 0, cancelled: 0 },
  reminders: {
    total: 0,
    pending: 0,
    processing: 0,
    sent: 0,
    completed: 0,
    cancelled: 0,
    failed: 0,
  },
};

describe("ReportExportService", () => {
  it("creates an Excel-friendly UTF-8 CSV", () => {
    const file = ReportExportService.createCsv(summary);
    expect(file.contentType).toBe("text/csv; charset=utf-8");
    expect(Array.from(file.body.slice(0, 3))).toEqual([0xef, 0xbb, 0xbf]);

    const content = new TextDecoder().decode(file.body);
    expect(content).toContain('"Categoria";"Total";"Detalle"');
    expect(content).toContain('"Pacientes";"1"');
  });

  it("creates a valid PDF document", async () => {
    const file = await ReportExportService.createPdf(summary);
    expect(file.contentType).toBe("application/pdf");
    expect(new TextDecoder().decode(file.body.slice(0, 5))).toBe("%PDF-");
    expect(file.body.length).toBeGreaterThan(500);
  });
});
