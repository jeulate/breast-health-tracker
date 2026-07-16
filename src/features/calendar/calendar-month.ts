export interface CalendarDay {
  date: string;
  dayNumber: number;
  inCurrentMonth: boolean;
}

export function getCurrentCalendarMonth(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/La_Paz",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return `${values.year}-${values.month}`;
}

export function normalizeCalendarMonth(value: string | undefined, fallback: string): string {
  if (!/^\d{4}-\d{2}$/.test(value ?? "")) return fallback;

  const month = Number(value?.slice(5, 7));
  return month >= 1 && month <= 12 ? (value as string) : fallback;
}

export function shiftCalendarMonth(month: string, amount: number): string {
  const [year, monthNumber] = month.split("-").map(Number);
  const shifted = new Date(Date.UTC(year, monthNumber - 1 + amount, 1));

  return `${shifted.getUTCFullYear()}-${String(shifted.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function getCalendarMonthRange(month: string): { from: string; to: string } {
  const [year, monthNumber] = month.split("-").map(Number);
  const lastDay = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();

  return {
    from: `${month}-01`,
    to: `${month}-${String(lastDay).padStart(2, "0")}`,
  };
}

export function buildCalendarDays(month: string): CalendarDay[] {
  const [year, monthNumber] = month.split("-").map(Number);
  const firstDay = new Date(Date.UTC(year, monthNumber - 1, 1));
  const mondayOffset = firstDay.getUTCDay() === 0 ? 6 : firstDay.getUTCDay() - 1;
  const gridStart = new Date(Date.UTC(year, monthNumber - 1, 1 - mondayOffset));

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setUTCDate(gridStart.getUTCDate() + index);
    const dateMonth = date.getUTCMonth() + 1;
    const value = `${date.getUTCFullYear()}-${String(dateMonth).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;

    return {
      date: value,
      dayNumber: date.getUTCDate(),
      inCurrentMonth: dateMonth === monthNumber && date.getUTCFullYear() === year,
    };
  });
}
