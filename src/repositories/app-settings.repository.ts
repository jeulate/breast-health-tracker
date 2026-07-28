import type { AppSettings } from "@/features/admin-settings";
import { getRedisClient } from "@/lib/redis/client";
import { redisKeys } from "@/lib/redis/keys";

export class AppSettingsRepository {
  private get redis() {
    return getRedisClient();
  }

  async find(): Promise<AppSettings | null> {
    const data = await this.redis.hgetall<Record<string, unknown>>(redisKeys.appSettings());

    if (!data || Object.keys(data).length === 0) {
      return null;
    }

    return this.deserialize(data);
  }

  async save(settings: AppSettings): Promise<void> {
    await this.redis.hset(redisKeys.appSettings(), this.serialize(settings));
  }

  private serialize(settings: AppSettings): Record<string, string> {
    return {
      appName: settings.appName,
      defaultTimezone: settings.defaultTimezone,
      userProfilePhotosEnabled: String(settings.userProfilePhotosEnabled),
      patientProfilePhotosEnabled: String(settings.patientProfilePhotosEnabled),
      profilePhotoMaxSizeMb: String(settings.profilePhotoMaxSizeMb),
      createdAt: settings.createdAt,
      updatedAt: settings.updatedAt,
      updatedBy: settings.updatedBy ?? "",
    };
  }

  private deserialize(data: Record<string, unknown>): AppSettings {
    const requiredString = (value: unknown): string =>
      typeof value === "string" ? value : String(value ?? "");

    const requiredBoolean = (value: unknown): boolean =>
      value === true || requiredString(value) === "true";

    const requiredNumber = (value: unknown): number => {
      const parsedValue = Number(value);
      return Number.isFinite(parsedValue) ? parsedValue : 0;
    };

    const updatedBy = requiredString(data.updatedBy);

    return {
      appName: requiredString(data.appName),
      defaultTimezone: requiredString(data.defaultTimezone),
      userProfilePhotosEnabled: requiredBoolean(data.userProfilePhotosEnabled),
      patientProfilePhotosEnabled: requiredBoolean(data.patientProfilePhotosEnabled),
      profilePhotoMaxSizeMb: requiredNumber(data.profilePhotoMaxSizeMb),
      createdAt: requiredString(data.createdAt),
      updatedAt: requiredString(data.updatedAt),
      updatedBy: updatedBy || null,
    };
  }
}

export const appSettingsRepository = new AppSettingsRepository();
