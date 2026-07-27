import { z } from "zod";

const userNameSchema = z
  .string()
  .trim()
  .min(2, "El nombre debe tener al menos 2 caracteres.")
  .max(120, "El nombre no puede superar los 120 caracteres.");

const userEmailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Ingresa un correo electrónico válido.")
  .max(254, "El correo electrónico no puede superar los 254 caracteres.");

const passwordSchema = z
  .string()
  .min(8, "La contraseña debe tener al menos 8 caracteres.")
  .max(72, "La contraseña no puede superar los 72 caracteres.");

export const createAdminUserSchema = z.object({
  name: userNameSchema,
  email: userEmailSchema,
  password: passwordSchema,
  role: z.enum(["ADMIN", "PROFESSIONAL"]),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
});

export const updateAdminUserSchema = z
  .strictObject({
    name: userNameSchema.optional(),
    role: z.enum(["ADMIN", "PROFESSIONAL"]).optional(),
    status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  })
  .refine(
    (value) => value.name !== undefined || value.role !== undefined || value.status !== undefined,
    {
      message: "Debes proporcionar al menos un campo para actualizar.",
    },
  );

export const resetAdminUserPasswordSchema = z.object({
  password: passwordSchema,
});

export type CreateAdminUserInput = z.infer<typeof createAdminUserSchema>;

export type UpdateAdminUserInput = z.infer<typeof updateAdminUserSchema>;

export type ResetAdminUserPasswordInput = z.infer<typeof resetAdminUserPasswordSchema>;
