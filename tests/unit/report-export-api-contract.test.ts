import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  summary: vi.fn(),
  create: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({ getSession: mocks.getSession }));
vi.mock("@/services/report.service", () => ({ ReportService: { summary: mocks.summary } }));
vi.mock("@/services/report-export.service", () => ({
  ReportExportService: { create: mocks.create },
}));

import { GET as getCsv } from "@/app/api/reports/export/csv/route";
import { GET as getPdf } from "@/app/api/reports/export/pdf/route";

const query = "from=2026-07-01&to=2026-07-31&patientStatus=ACTIVE";

describe("report export API contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSession.mockResolvedValue({ sub: "user-1", role: "ADMIN" });
    mocks.summary.mockResolvedValue({ period: { from: "2026-07-01", to: "2026-07-31" } });
    mocks.create.mockImplementation((format: string) => ({
      body: new TextEncoder().encode(format),
      contentType: format === "csv" ? "text/csv; charset=utf-8" : "application/pdf",
      filename: `report.${format}`,
    }));
  });

  it("rejects unauthenticated and unauthorized users", async () => {
    mocks.getSession.mockResolvedValue(null);
    expect(
      (await getCsv(new Request(`http://localhost/api/reports/export/csv?${query}`))).status,
    ).toBe(401);
    mocks.getSession.mockResolvedValue({ sub: "user-2", role: "PATIENT" });
    expect(
      (await getPdf(new Request(`http://localhost/api/reports/export/pdf?${query}`))).status,
    ).toBe(403);
    expect(mocks.summary).not.toHaveBeenCalled();
  });

  it("rejects invalid filters", async () => {
    const response = await getCsv(
      new Request("http://localhost/api/reports/export/csv?from=2026-08-01&to=2026-07-01"),
    );
    expect(response.status).toBe(400);
    expect(mocks.summary).not.toHaveBeenCalled();
  });

  it.each([
    ["csv", getCsv, "text/csv; charset=utf-8"],
    ["pdf", getPdf, "application/pdf"],
  ])("downloads a protected %s export", async (format, handler, contentType) => {
    const response = await handler(
      new Request(`http://localhost/api/reports/export/${format}?${query}`),
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe(contentType);
    expect(response.headers.get("content-disposition")).toBe(
      `attachment; filename="report.${format}"`,
    );
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(mocks.summary).toHaveBeenCalledWith({
      from: "2026-07-01",
      to: "2026-07-31",
      patientStatus: "ACTIVE",
    });
    expect(mocks.create).toHaveBeenCalledWith(format, expect.anything());
  });

  it("returns a stable response when generation fails", async () => {
    mocks.create.mockRejectedValue(new Error("PDF error"));
    const response = await getPdf(new Request(`http://localhost/api/reports/export/pdf?${query}`));
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "No fue posible exportar el reporte." },
    });
  });
});
