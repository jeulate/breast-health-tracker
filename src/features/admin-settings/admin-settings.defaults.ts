import type { ConfigurableAppSettings } from "./admin-settings.types";

export const DEFAULT_APP_SETTINGS = {
  appName: "BI-RADS Tracker",
  defaultTimezone: "America/La_Paz",
  userProfilePhotosEnabled: true,
  patientProfilePhotosEnabled: true,
  profilePhotoMaxSizeMb: 5,
} satisfies ConfigurableAppSettings;

export const PROFILE_PHOTO_MIN_SIZE_MB = 1;
export const PROFILE_PHOTO_MAX_SIZE_MB = 10;
