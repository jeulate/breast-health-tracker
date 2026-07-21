import { describe, expect, it } from "vitest";
import { buildTelegramReminderMessage } from "@/features/telegram/telegram-reminder-message";

describe("Telegram reminder message", () => {
  it("contains the control date without clinical details", () => {
    const message = buildTelegramReminderMessage("2026-07-25");
    expect(message).toContain("25 de julio de 2026");
    expect(message).not.toMatch(/BI-RADS|hallazgo|diagnóstico|biopsia/i);
  });
});
