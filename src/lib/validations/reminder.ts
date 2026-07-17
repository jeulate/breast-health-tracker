import { z } from "zod";
import { REMINDER_CHANNELS, REMINDER_SOURCES, REMINDER_STATUSES } from "@/features/reminders";

function isValidDateOnly(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
}

function isValidTimezone(value: string): boolean {
  try {
    new Intl.DateTimeFormat("es-BO", { timeZone: value }).format();
    return true;
  } catch {
    return false;
  }
}

const identifierSchema = z.string().uuid("Selecciona un registro de origen válido.");
const dateOnlySchema = z
  .string()
  .trim()
  .refine(isValidDateOnly, "Ingresa una fecha válida con formato AAAA-MM-DD.");
const dateTimeSchema = z.iso.datetime({ offset: true });
const timezoneSchema = z
  .string()
  .trim()
  .min(1, "Selecciona una zona horaria.")
  .refine(isValidTimezone, "Selecciona una zona horaria válida.");

export const createReminderSchema = z
  .object({
    patientId: identifierSchema,
    source: z.enum(REMINDER_SOURCES),
    sourceId: identifierSchema,
    targetDate: dateOnlySchema,
    scheduledFor: dateTimeSchema,
    timezone: timezoneSchema.default("America/La_Paz"),
    channel: z.enum(REMINDER_CHANNELS).default("IN_APP"),
    maxAttempts: z.number().int().min(1).max(10).default(3),
  })
  .strict();

export const reminderSchema = createReminderSchema
  .safeExtend({
    id: z.string().regex(/^rem_[a-f0-9]{32}$/, "El identificador del recordatorio no es válido."),
    status: z.enum(REMINDER_STATUSES),
    attempts: z.number().int().min(0),
    lastAttemptAt: dateTimeSchema.optional(),
    sentAt: dateTimeSchema.optional(),
    completedAt: dateTimeSchema.optional(),
    cancelledAt: dateTimeSchema.optional(),
    lastError: z.string().trim().min(1).max(500).optional(),
    createdAt: dateTimeSchema,
    updatedAt: dateTimeSchema,
  })
  .superRefine((reminder, context) => {
    if (reminder.attempts > reminder.maxAttempts) {
      context.addIssue({
        code: "custom",
        path: ["attempts"],
        message: "Los intentos realizados no pueden superar el máximo permitido.",
      });
    }

    const requiredByStatus = [
      ["PROCESSING", "lastAttemptAt", reminder.lastAttemptAt],
      ["SENT", "sentAt", reminder.sentAt],
      ["COMPLETED", "completedAt", reminder.completedAt],
      ["CANCELLED", "cancelledAt", reminder.cancelledAt],
      ["FAILED", "lastError", reminder.lastError],
    ] as const;

    for (const [status, field, value] of requiredByStatus) {
      if (reminder.status === status && !value) {
        context.addIssue({
          code: "custom",
          path: [field],
          message: `El estado ${status} requiere completar ${field}.`,
        });
      }
    }
  });

export const rescheduleReminderSchema = z
  .object({
    scheduledFor: dateTimeSchema,
    timezone: timezoneSchema.optional(),
  })
  .strict();

export type CreateReminderInput = z.input<typeof createReminderSchema>;
export type CreateReminderData = z.infer<typeof createReminderSchema>;
export type ReminderData = z.infer<typeof reminderSchema>;
export type RescheduleReminderInput = z.input<typeof rescheduleReminderSchema>;
