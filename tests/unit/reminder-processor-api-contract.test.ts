import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getServerEnv: vi.fn(),
  processDue: vi.fn(),
}));

vi.mock("@/config/env", () => ({ getServerEnv: mocks.getServerEnv }));
vi.mock("@/services/reminder-processor.service", () => ({
  ReminderProcessorService: class {
    processDue = mocks.processDue;
  },
}));

import { POST } from "@/app/api/internal/reminders/process/route";

const secret = "a-secure-reminder-processor-secret-123456";
const url = "http://localhost/api/internal/reminders/process";

function request(token = secret, suffix = ""): Request {
  return new Request(`${url}${suffix}`, {
    method: "POST",
    headers: { authorization: `Bearer ${token}` },
  });
}

describe("reminder processor API contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getServerEnv.mockReturnValue({ REMINDER_PROCESSOR_SECRET: secret });
    mocks.processDue.mockResolvedValue({
      claimed: 1,
      sent: 1,
      retried: 0,
      failed: 0,
      skipped: 0,
      recovered: 0,
    });
  });

  it("rejects requests without bearer credentials", async () => {
    const response = await POST(new Request(url, { method: "POST" }));
    expect(response.status).toBe(401);
    expect(mocks.processDue).not.toHaveBeenCalled();
  });

  it("rejects an invalid bearer token", async () => {
    const response = await POST(request("incorrect-secret-with-sufficient-length"));
    expect(response.status).toBe(401);
    expect(mocks.processDue).not.toHaveBeenCalled();
  });

  it("returns 503 when the processor secret is not configured", async () => {
    mocks.getServerEnv.mockReturnValue({ REMINDER_PROCESSOR_SECRET: undefined });
    const response = await POST(request());
    expect(response.status).toBe(503);
    expect(mocks.processDue).not.toHaveBeenCalled();
  });

  it("processes due reminders with the default limit", async () => {
    const response = await POST(request());
    expect(response.status).toBe(200);
    expect(mocks.processDue).toHaveBeenCalledWith(100);
    expect(await response.json()).toEqual({
      success: true,
      data: expect.objectContaining({ claimed: 1, sent: 1 }),
    });
  });

  it("accepts a controlled custom limit", async () => {
    const response = await POST(request(secret, "?limit=25"));
    expect(response.status).toBe(200);
    expect(mocks.processDue).toHaveBeenCalledWith(25);
  });

  it("rejects limits outside the supported range", async () => {
    const response = await POST(request(secret, "?limit=101"));
    expect(response.status).toBe(400);
    expect(mocks.processDue).not.toHaveBeenCalled();
  });

  it("returns a consistent internal error when processing fails", async () => {
    mocks.processDue.mockRejectedValue(new Error("Redis unavailable"));
    const response = await POST(request());
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "No fue posible procesar los recordatorios.",
      },
    });
  });
});
