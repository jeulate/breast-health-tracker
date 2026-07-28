import {
  DEFAULT_APP_SETTINGS,
  type AppSettings,
  type UpdateAppSettingsInput,
} from "@/features/admin-settings";
import {
  AppSettingsRepository,
  appSettingsRepository,
} from "@/repositories/app-settings.repository";

export class AdminSettingsService {
  constructor(private readonly repository: AppSettingsRepository = appSettingsRepository) {}

  async getSettings(): Promise<AppSettings> {
    const storedSettings = await this.repository.find();

    if (storedSettings) {
      return storedSettings;
    }

    return this.buildDefaultSettings();
  }

  async updateSettings(input: UpdateAppSettingsInput, updatedBy: string): Promise<AppSettings> {
    const currentSettings = await this.repository.find();
    const now = new Date().toISOString();

    const settings: AppSettings = {
      ...input,
      createdAt: currentSettings?.createdAt ?? now,
      updatedAt: now,
      updatedBy,
    };

    await this.repository.save(settings);

    return settings;
  }

  private buildDefaultSettings(): AppSettings {
    const now = new Date().toISOString();

    return {
      ...DEFAULT_APP_SETTINGS,
      createdAt: now,
      updatedAt: now,
      updatedBy: null,
    };
  }
}

export const adminSettingsService = new AdminSettingsService();
