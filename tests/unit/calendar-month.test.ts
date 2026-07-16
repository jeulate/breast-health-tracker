import { describe, expect, it } from "vitest";
import {
  buildCalendarDays,
  getCalendarMonthRange,
  normalizeCalendarMonth,
  shiftCalendarMonth,
} from "@/features/calendar/calendar-month";

describe("calendar month helpers", () => {
  it("normalizes invalid months with a fallback", () => {
    expect(normalizeCalendarMonth("2026-13", "2026-07")).toBe("2026-07");
    expect(normalizeCalendarMonth(undefined, "2026-07")).toBe("2026-07");
    expect(normalizeCalendarMonth("2026-08", "2026-07")).toBe("2026-08");
  });

  it("shifts months across year boundaries", () => {
    expect(shiftCalendarMonth("2026-01", -1)).toBe("2025-12");
    expect(shiftCalendarMonth("2026-12", 1)).toBe("2027-01");
  });

  it("calculates month ranges including leap years", () => {
    expect(getCalendarMonthRange("2028-02")).toEqual({ from: "2028-02-01", to: "2028-02-29" });
    expect(getCalendarMonthRange("2026-02")).toEqual({ from: "2026-02-01", to: "2026-02-28" });
  });

  it("builds a six-week grid starting on Monday", () => {
    const days = buildCalendarDays("2026-08");
    expect(days).toHaveLength(42);
    expect(days[0].date).toBe("2026-07-27");
    expect(days[41].date).toBe("2026-09-06");
  });

  it("marks days outside the selected month", () => {
    const days = buildCalendarDays("2026-08");
    expect(days.find((day) => day.date === "2026-07-31")?.inCurrentMonth).toBe(false);
    expect(days.find((day) => day.date === "2026-08-01")?.inCurrentMonth).toBe(true);
  });
});
