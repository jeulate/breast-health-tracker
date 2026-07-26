import type { PublicUser } from "@/types";

export const PROFILE_THEMES = ["LIGHT", "DARK", "SYSTEM"] as const;
export const PROFILE_LANGUAGES = ["es", "en"] as const;

export type ProfileTheme = (typeof PROFILE_THEMES)[number];
export type ProfileLanguage = (typeof PROFILE_LANGUAGES)[number];

export interface UserPreferences {
  userId: string;
  theme: ProfileTheme;
  language: ProfileLanguage;
  timezone: string;
  inAppNotifications: boolean;
  telegramNotifications: boolean;
  clinicalReminders: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  user: PublicUser;
  preferences: UserPreferences;
}

export interface UpdateUserProfileInput {
  name?: string;
  theme?: ProfileTheme;
  language?: ProfileLanguage;
  timezone?: string;
  inAppNotifications?: boolean;
  telegramNotifications?: boolean;
  clinicalReminders?: boolean;
}
