import { describe, expect, it } from "vitest";
import {
  TELEGRAM_MESSAGES,
  telegramLinkFailureMessage,
} from "@/features/telegram/telegram-messages";

describe("Telegram messages", () => {
  it("keeps successful messages free of clinical details", () => {
    expect(TELEGRAM_MESSAGES.linked).not.toMatch(/BI-RADS|diagnóstico|hallazgo/i);
  });
  it("maps expired tokens to a safe message", () => {
    expect(telegramLinkFailureMessage("EXPIRED_TOKEN")).toContain("venció");
  });
});
