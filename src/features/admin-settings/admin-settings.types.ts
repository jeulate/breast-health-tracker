export interface AppSettings {
  appName: string;
  defaultTimezone: string;
  userProfilePhotosEnabled: boolean;
  patientProfilePhotosEnabled: boolean;
  profilePhotoMaxSizeMb: number;
  createdAt: string;
  updatedAt: string;
  updatedBy: string | null;
}

export interface ConfigurableAppSettings {
  appName: string;
  defaultTimezone: string;
  userProfilePhotosEnabled: boolean;
  patientProfilePhotosEnabled: boolean;
  profilePhotoMaxSizeMb: number;
}

export type UpdateAppSettingsInput = ConfigurableAppSettings;
