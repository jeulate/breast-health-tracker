import { z } from "zod";

const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Usa el formato YYYY-MM-DD")
  .refine((value) => !Number.isNaN(Date.parse(`${value}T00:00:00.000Z`)), "Fecha inválida");

export const reportFiltersSchema = z
  .object({
    from: date,
    to: date,
    patientId: z.string().trim().min(1).optional(),
    patientStatus: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  })
  .refine((value) => value.from <= value.to, {
    message: "La fecha inicial no puede ser posterior a la fecha final",
    path: ["to"],
  });

export type ReportFiltersInput = z.infer<typeof reportFiltersSchema>;
