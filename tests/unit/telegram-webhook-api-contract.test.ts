import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getServerEnv: vi.fn(),
  createTelegramBot: vi.fn(() => ({ bot: true })),
  handler: vi.fn(),
  webhookCallback: vi.fn(),
}));
vi.mock("@/config/env", () => ({ getServerEnv: mocks.getServerEnv }));
vi.mock("@/services/telegram-bot.service", () => ({ createTelegramBot: mocks.createTelegramBot }));
vi.mock("grammy", () => ({ webhookCallback: mocks.webhookCallback }));

import { POST } from "@/app/api/telegram/webhook/route";

describe("Telegram webhook API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getServerEnv.mockReturnValue({
      TELEGRAM_BOT_TOKEN: "123456789:abcdefghijklmnopqrstuvwxyz",
      TELEGRAM_WEBHOOK_SECRET: "s".repeat(32),
    });
    mocks.handler.mockResolvedValue(new Response("ok"));
    mocks.webhookCallback.mockReturnValue(mocks.handler);
  });

  it("returns 503 when Telegram is not configured", async () => {
    mocks.getServerEnv.mockReturnValue({});
    expect(
      (await POST(new Request("http://localhost/api/telegram/webhook", { method: "POST" }))).status,
    ).toBe(503);
  });

  it("rejects an invalid webhook secret before creating the bot", async () => {
    const response = await POST(
      new Request("http://localhost/api/telegram/webhook", {
        method: "POST",
        headers: { "x-telegram-bot-api-secret-token": "invalid" },
      }),
    );
    expect(response.status).toBe(401);
    expect(mocks.createTelegramBot).not.toHaveBeenCalled();
  });

  it("forwards an authenticated update through the Next.js adapter", async () => {
    const request = new Request("http://localhost/api/telegram/webhook", {
      method: "POST",
      headers: { "x-telegram-bot-api-secret-token": "s".repeat(32) },
    });
    expect(await POST(request)).toBeInstanceOf(Response);
    expect(mocks.webhookCallback).toHaveBeenCalledWith({ bot: true }, "std/http");
    expect(mocks.handler).toHaveBeenCalledWith(request);
  });
});
