import { describe, expect, it } from "vitest";
import {
  formatReminderDateOnly,
  formatReminderDateTime,
  reminderChannelLabel,
} from "@/features/reminders/reminder-display";

describe("reminder display helpers", () => {
  it("formats dates deterministically without locale-specific spacing", () => {
    expect(formatReminderDateOnly("2026-10-31")).toBe("31 oct 2026");
    expect(formatReminderDateTime("2026-10-31T13:00:00.000Z", "America/La_Paz")).toBe(
      "31 oct 2026, 09:00",
    );
  });

  it("labels the actual reminder channel", () => {
    expect(reminderChannelLabel("IN_APP")).toBe("Panel interno");
    expect(reminderChannelLabel("TELEGRAM")).toBe("Telegram");
  });
});
