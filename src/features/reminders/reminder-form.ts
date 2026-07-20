import type { ReminderCandidate, ReminderChannel } from "./reminder.types";

function localParts(instant: Date, timezone: string): Record<string, string> {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(instant);

  return Object.fromEntries(parts.map((part) => [part.type, part.value]));
}

function parseLocalDateTime(value: string): [number, number, number, number, number] {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) throw new Error("Selecciona una fecha y hora válidas.");

  const values = match.slice(1).map(Number) as [number, number, number, number, number];
  const [year, month, day, hour, minute] = values;
  const date = new Date(Date.UTC(year, month - 1, day, hour, minute));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day ||
    date.getUTCHours() !== hour ||
    date.getUTCMinutes() !== minute
  ) {
    throw new Error("Selecciona una fecha y hora válidas.");
  }
  return values;
}

export function toZonedIsoDateTime(value: string, timezone: string): string {
  const [year, month, day, hour, minute] = parseLocalDateTime(value);
  const desiredUtc = Date.UTC(year, month - 1, day, hour, minute);
  let guess = desiredUtc;

  for (let iteration = 0; iteration < 3; iteration += 1) {
    const parts = localParts(new Date(guess), timezone);
    const observedUtc = Date.UTC(
      Number(parts.year),
      Number(parts.month) - 1,
      Number(parts.day),
      Number(parts.hour),
      Number(parts.minute),
    );
    guess += desiredUtc - observedUtc;
  }

  const normalized = toDateTimeLocal(new Date(guess).toISOString(), timezone);
  if (normalized !== value) throw new Error("La hora seleccionada no existe en la zona horaria.");

  return new Date(guess).toISOString();
}

export function toDateTimeLocal(isoDateTime: string, timezone: string): string {
  const date = new Date(isoDateTime);
  if (Number.isNaN(date.getTime())) throw new Error("La fecha programada no es válida.");

  const parts = localParts(date, timezone);
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

export function defaultReminderTime(targetDate: string): string {
  return `${targetDate}T09:00`;
}

export function buildReminderPayload(
  candidate: ReminderCandidate,
  scheduledLocal: string,
  timezone: string,
  channel: ReminderChannel = "IN_APP",
) {
  return {
    source: candidate.source,
    sourceId: candidate.sourceId,
    targetDate: candidate.targetDate,
    scheduledFor: toZonedIsoDateTime(scheduledLocal, timezone),
    timezone,
    channel,
  };
}
