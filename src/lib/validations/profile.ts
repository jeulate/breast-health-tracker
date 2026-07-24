import { z } from "zod";
import { PROFILE_LANGUAGES, PROFILE_THEMES } from "@/features/profile";

function isValidTimezone(value: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value }).format();
    return true;
  } catch {
    return false;
  }
}

export const updateUserProfileSchema = z
  .object({
    name: z.string().trim().min(2).max(100).optional(),
    theme: z.enum(PROFILE_THEMES).optional(),
    language: z.enum(PROFILE_LANGUAGES).optional(),
    timezone: z.string().trim().min(1).refine(isValidTimezone, "Invalid timezone").optional(),
    inAppNotifications: z.boolean().optional(),
    telegramNotifications: z.boolean().optional(),
    clinicalReminders: z.boolean().optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, "At least one field is required");

export type UpdateUserProfileRequest = z.infer<typeof updateUserProfileSchema>;
