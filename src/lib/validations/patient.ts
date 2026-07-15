import { z } from "zod";

const BOLIVIA_TIMEZONE = "America/La_Paz" as const;

function isValidDateOnly(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
}

function isNotFutureDate(value: string): boolean {
  const today = new Date();
  const currentDate = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  return Date.parse(`${value}T00:00:00.000Z`) <= currentDate;
}

const fullNameSchema = z
  .string()
  .trim()
  .min(2, "El nombre debe tener al menos 2 caracteres.")
  .max(200, "El nombre no puede superar los 200 caracteres.");

const birthDateSchema = z
  .string()
  .trim()
  .optional()
  .transform((value) => value || undefined)
  .refine((value) => value === undefined || isValidDateOnly(value), {
    message: "Ingresa una fecha de nacimiento válida.",
  })
  .refine((value) => value === undefined || isNotFutureDate(value), {
    message: "La fecha de nacimiento no puede estar en el futuro.",
  });

export const createPatientSchema = z.object({
  fullName: fullNameSchema,
  birthDate: birthDateSchema,
  timezone: z.literal(BOLIVIA_TIMEZONE).default(BOLIVIA_TIMEZONE),
});

export const updatePatientSchema = z.object({
  fullName: fullNameSchema.optional(),
  birthDate: birthDateSchema,
  timezone: z.literal(BOLIVIA_TIMEZONE).optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});

export type CreatePatientInput = z.infer<typeof createPatientSchema>;
export type UpdatePatientInput = z.infer<typeof updatePatientSchema>;
