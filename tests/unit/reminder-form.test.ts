import { describe, expect, it } from "vitest";
import {
  buildReminderPayload,
  defaultReminderTime,
  toDateTimeLocal,
  toZonedIsoDateTime,
} from "@/features/reminders/reminder-form";

const candidate = {
  id: "clinical-event:event-1",
  source: "CLINICAL_EVENT" as const,
  sourceId: "9d1138d8-89b7-47ba-a570-a0a92cc0a850",
  targetDate: "2026-07-25",
  title: "Control programado",
};

describe("reminder form date helpers", () => {
  it("converts Bolivia local time to an ISO instant", () => {
    expect(toZonedIsoDateTime("2026-07-24T09:00", "America/La_Paz")).toBe(
      "2026-07-24T13:00:00.000Z",
    );
  });

  it("converts an ISO instant back to the patient timezone", () => {
    expect(toDateTimeLocal("2026-07-24T13:00:00.000Z", "America/La_Paz")).toBe("2026-07-24T09:00");
  });

  it("builds a payload from the selected source without clinical descriptions", () => {
    expect(buildReminderPayload(candidate, "2026-07-24T09:00", "America/La_Paz")).toEqual({
      source: "CLINICAL_EVENT",
      sourceId: candidate.sourceId,
      targetDate: "2026-07-25",
      scheduledFor: "2026-07-24T13:00:00.000Z",
      timezone: "America/La_Paz",
    });
  });

  it("provides a same-day default that remains editable", () => {
    expect(defaultReminderTime("2026-07-25")).toBe("2026-07-25T09:00");
  });

  it("rejects impossible or malformed local values", () => {
    expect(() => toZonedIsoDateTime("2026-02-30T09:00", "America/La_Paz")).toThrow();
    expect(() => toZonedIsoDateTime("invalid", "America/La_Paz")).toThrow();
  });

  it("rejects nonexistent daylight-saving times", () => {
    expect(() => toZonedIsoDateTime("2026-03-08T02:30", "America/New_York")).toThrow();
  });
});
