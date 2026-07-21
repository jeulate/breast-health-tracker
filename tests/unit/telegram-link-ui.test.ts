import { describe, expect, it } from "vitest";
import {
  buildTelegramStartCommand,
  formatTelegramLinkExpiry,
} from "@/features/telegram/telegram-link-ui";

describe("Telegram link UI helpers", () => {
  it("builds the private start command", () => {
    expect(buildTelegramStartCommand("token_value")).toBe("/start token_value");
  });

  it("formats expiration in the Bolivia timezone", () => {
    expect(formatTelegramLinkExpiry("2026-07-20T19:30:00.000Z")).toContain("3:30");
  });
});
