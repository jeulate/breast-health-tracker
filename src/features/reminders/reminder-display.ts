import type { ReminderChannel } from "./reminder.types";

const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

export function formatReminderDateOnly(value: string): string {
  const [year, month, day] = value.split("-").map(Number);
  return `${String(day).padStart(2, "0")} ${MONTHS[month - 1]} ${year}`;
}

export function formatReminderDateTime(value: string, timezone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(value));
  const fields = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const month = MONTHS[Number(fields.month) - 1];

  return `${fields.day} ${month} ${fields.year}, ${fields.hour}:${fields.minute}`;
}

export function reminderChannelLabel(channel: ReminderChannel): string {
  return channel === "TELEGRAM" ? "Telegram" : "Panel interno";
}
