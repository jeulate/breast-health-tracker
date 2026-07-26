import type {
  ProfileLanguage,
  ProfileTheme,
  UpdateUserProfileInput,
  UserProfile,
} from "@/features/profile";

export interface ProfileFormValues {
  name: string;
  theme: ProfileTheme;
  language: ProfileLanguage;
  timezone: string;
  inAppNotifications: boolean;
  telegramNotifications: boolean;
  clinicalReminders: boolean;
}

export function toProfileFormValues(profile: UserProfile): ProfileFormValues {
  return {
    name: profile.user.name,
    theme: profile.preferences.theme,
    language: profile.preferences.language,
    timezone: profile.preferences.timezone,
    inAppNotifications: profile.preferences.inAppNotifications,
    telegramNotifications: profile.preferences.telegramNotifications,
    clinicalReminders: profile.preferences.clinicalReminders,
  };
}

export function toUpdateProfileInput(values: ProfileFormValues): UpdateUserProfileInput {
  return {
    name: values.name.trim(),
    theme: values.theme,
    language: values.language,
    timezone: values.timezone,
    inAppNotifications: values.inAppNotifications,
    telegramNotifications: values.telegramNotifications,
    clinicalReminders: values.clinicalReminders,
  };
}

export function profileThemeToNextTheme(theme: ProfileTheme): "light" | "dark" | "system" {
  return theme.toLowerCase() as "light" | "dark" | "system";
}
