import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  calendarService: {
    list: vi.fn(),
  },
}));

vi.mock("@/lib/auth/session", () => ({ getSession: mocks.getSession }));

vi.mock("@/services/calendar.service", () => ({
  CalendarService: mocks.calendarService,
}));

import { GET } from "@/app/api/calendar/route";

const session = { sub: "user-1", email: "admin@example.com", role: "ADMIN" };
const baseUrl = "http://localhost/api/calendar";

describe("calendar API contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSession.mockResolvedValue(session);
    mocks.calendarService.list.mockResolvedValue([]);
  });

  it("rejects unauthenticated requests", async () => {
    mocks.getSession.mockResolvedValue(null);

    const response = await GET(new Request(`${baseUrl}?from=2026-08-01&to=2026-08-31`));

    expect(response.status).toBe(401);
    expect(mocks.calendarService.list).not.toHaveBeenCalled();
  });

  it("lists a valid range with the default status", async () => {
    const response = await GET(new Request(`${baseUrl}?from=2026-08-01&to=2026-08-31`));

    expect(response.status).toBe(200);
    expect(mocks.calendarService.list).toHaveBeenCalledWith({
      from: "2026-08-01",
      to: "2026-08-31",
      status: "ALL",
    });
  });

  it("passes an available status filter to the service", async () => {
    const response = await GET(
      new Request(`${baseUrl}?from=2026-08-01&to=2026-08-31&status=SCHEDULED`),
    );

    expect(response.status).toBe(200);
    expect(mocks.calendarService.list).toHaveBeenCalledWith(
      expect.objectContaining({ status: "SCHEDULED" }),
    );
  });

  it("returns 400 when required dates are missing", async () => {
    const response = await GET(new Request(baseUrl));

    expect(response.status).toBe(400);
    expect(mocks.calendarService.list).not.toHaveBeenCalled();
  });

  it("returns 400 for reversed dates or an invalid status", async () => {
    const reversed = await GET(new Request(`${baseUrl}?from=2026-09-01&to=2026-08-01`));
    const invalidStatus = await GET(
      new Request(`${baseUrl}?from=2026-08-01&to=2026-08-31&status=RECORDED`),
    );

    expect(reversed.status).toBe(400);
    expect(invalidStatus.status).toBe(400);
    expect(mocks.calendarService.list).not.toHaveBeenCalled();
  });

  it("returns a consistent internal error when the service fails", async () => {
    mocks.calendarService.list.mockRejectedValue(new Error("Redis unavailable"));

    const response = await GET(new Request(`${baseUrl}?from=2026-08-01&to=2026-08-31`));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "No fue posible consultar el calendario.",
      },
    });
  });
});
