import { z } from "zod";
import { CALENDAR_ITEM_STATUSES } from "@/features/calendar";

function isValidDateOnly(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
}

function daysBetween(from: string, to: string): number {
  return (Date.parse(`${to}T00:00:00.000Z`) - Date.parse(`${from}T00:00:00.000Z`)) / 86_400_000;
}

const dateSchema = z
  .string()
  .trim()
  .refine(isValidDateOnly, "Ingresa una fecha válida con formato AAAA-MM-DD.");

export const calendarRangeSchema = z
  .object({
    from: dateSchema,
    to: dateSchema,
    status: z.enum(["ALL", ...CALENDAR_ITEM_STATUSES]).default("ALL"),
  })
  .strict()
  .superRefine((data, context) => {
    if (!isValidDateOnly(data.from) || !isValidDateOnly(data.to)) return;

    if (data.from > data.to) {
      context.addIssue({
        code: "custom",
        path: ["to"],
        message: "La fecha final debe ser igual o posterior a la fecha inicial.",
      });
      return;
    }

    if (daysBetween(data.from, data.to) > 366) {
      context.addIssue({
        code: "custom",
        path: ["to"],
        message: "El rango del calendario no puede superar 366 días.",
      });
    }
  });

export type CalendarRangeInput = z.input<typeof calendarRangeSchema>;
export type CalendarRangeQuery = z.infer<typeof calendarRangeSchema>;
