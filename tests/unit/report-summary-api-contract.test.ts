import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  reportService: { summary: vi.fn() },
}));

vi.mock("@/lib/auth/session", () => ({ getSession: mocks.getSession }));
vi.mock("@/services/report.service", () => ({ ReportService: mocks.reportService }));

import { GET } from "@/app/api/reports/summary/route";

const baseUrl = "http://localhost/api/reports/summary";
const summary = {
  period: { from: "2026-07-01", to: "2026-07-31" },
  patients: { total: 0, active: 0, inactive: 0 },
  findings: { total: 0, followUp: 0, closed: 0 },
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

describe("report summary API contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSession.mockResolvedValue({
      sub: "user-1",
      email: "admin@example.com",
      role: "ADMIN",
    });
    mocks.reportService.summary.mockResolvedValue(summary);
  });

  it("rejects a request without a session", async () => {
    mocks.getSession.mockResolvedValue(null);

    const response = await GET(new Request(`${baseUrl}?from=2026-07-01&to=2026-07-31`));

    expect(response.status).toBe(401);
    expect(mocks.reportService.summary).not.toHaveBeenCalled();
  });

  it("rejects a role without report access", async () => {
    mocks.getSession.mockResolvedValue({ sub: "user-2", role: "PATIENT" });

    const response = await GET(new Request(`${baseUrl}?from=2026-07-01&to=2026-07-31`));

    expect(response.status).toBe(403);
    expect(mocks.reportService.summary).not.toHaveBeenCalled();
  });

  it("returns the report and passes all valid filters", async () => {
    const response = await GET(
      new Request(
        `${baseUrl}?from=2026-07-01&to=2026-07-31&patientId=patient-1&patientStatus=ACTIVE`,
      ),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ success: true, data: summary });
    expect(mocks.reportService.summary).toHaveBeenCalledWith({
      from: "2026-07-01",
      to: "2026-07-31",
      patientId: "patient-1",
      patientStatus: "ACTIVE",
    });
  });

  it("returns 400 when dates are missing or reversed", async () => {
    const missing = await GET(new Request(baseUrl));
    const reversed = await GET(new Request(`${baseUrl}?from=2026-08-01&to=2026-07-31`));

    expect(missing.status).toBe(400);
    expect(reversed.status).toBe(400);
    expect(mocks.reportService.summary).not.toHaveBeenCalled();
  });

  it("allows the PROFESSIONAL role", async () => {
    mocks.getSession.mockResolvedValue({
      sub: "user-2",
      email: "professional@example.com",
      role: "PROFESSIONAL",
    });

    const response = await GET(new Request(`${baseUrl}?from=2026-07-01&to=2026-07-31`));

    expect(response.status).toBe(200);
    expect(mocks.reportService.summary).toHaveBeenCalledOnce();
  });

  it("returns a stable internal error when report generation fails", async () => {
    mocks.reportService.summary.mockRejectedValue(new Error("Redis unavailable"));

    const response = await GET(new Request(`${baseUrl}?from=2026-07-01&to=2026-07-31`));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "No fue posible generar el reporte.",
      },
    });
  });
});
