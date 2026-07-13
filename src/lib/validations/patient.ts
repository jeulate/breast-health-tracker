import { z } from "zod";

export const createPatientSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters").max(200),
  birthDate: z.string().optional(),
  timezone: z.string().default("America/Mexico_City"),
});

export const updatePatientSchema = z.object({
  fullName: z.string().min(2).max(200).optional(),
  birthDate: z.string().optional(),
  timezone: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});

export type CreatePatientInput = z.infer<typeof createPatientSchema>;
export type UpdatePatientInput = z.infer<typeof updatePatientSchema>;
