import { z } from "zod";

import { PROFILE_PHOTO_MAX_SIZE_MB, PROFILE_PHOTO_MIN_SIZE_MB } from "@/features/admin-settings";

function isValidIanaTimezone(value: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", {
      timeZone: value,
    }).format();

    return true;
  } catch {
    return false;
  }
}

const appNameSchema = z
  .string()
  .trim()
  .min(2, "El nombre de la aplicación debe tener al menos 2 caracteres.")
  .max(80, "El nombre de la aplicación no puede superar los 80 caracteres.");

const timezoneSchema = z
  .string()
  .trim()
  .min(1, "La zona horaria es obligatoria.")
  .max(100, "La zona horaria no puede superar los 100 caracteres.")
  .refine(isValidIanaTimezone, {
    message: "Selecciona una zona horaria IANA válida.",
  });

const profilePhotoMaxSizeMbSchema = z
  .number()
  .int("El tamaño máximo debe ser un número entero.")
  .min(
    PROFILE_PHOTO_MIN_SIZE_MB,
    `El tamaño máximo debe ser de al menos ${PROFILE_PHOTO_MIN_SIZE_MB} MB.`,
  )
  .max(
    PROFILE_PHOTO_MAX_SIZE_MB,
    `El tamaño máximo no puede superar los ${PROFILE_PHOTO_MAX_SIZE_MB} MB.`,
  );

export const updateAdminSettingsSchema = z.strictObject({
  appName: appNameSchema,
  defaultTimezone: timezoneSchema,
  userProfilePhotosEnabled: z.boolean(),
  patientProfilePhotosEnabled: z.boolean(),
  profilePhotoMaxSizeMb: profilePhotoMaxSizeMbSchema,
});

export type UpdateAdminSettingsInput = z.infer<typeof updateAdminSettingsSchema>;
