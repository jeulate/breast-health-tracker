import type { UserPreferences } from "@/features/profile";
import { getRedisClient } from "@/lib/redis/client";
import { redisKeys } from "@/lib/redis/keys";

export class UserPreferencesRepository {
  private get redis() {
    return getRedisClient();
  }

  async findByUserId(userId: string): Promise<UserPreferences | null> {
    const data = await this.redis.hgetall<Record<string, unknown>>(
      redisKeys.userPreferences(userId),
    );
    if (!data || Object.keys(data).length === 0) return null;
    return this.deserialize(data);
  }

  async save(preferences: UserPreferences): Promise<void> {
    await this.redis.hset(
      redisKeys.userPreferences(preferences.userId),
      this.serialize(preferences),
    );
  }

  private serialize(preferences: UserPreferences): Record<string, string> {
    return {
      userId: preferences.userId,
      theme: preferences.theme,
      language: preferences.language,
      timezone: preferences.timezone,
      inAppNotifications: String(preferences.inAppNotifications),
      telegramNotifications: String(preferences.telegramNotifications),
      clinicalReminders: String(preferences.clinicalReminders),
      createdAt: preferences.createdAt,
      updatedAt: preferences.updatedAt,
    };
  }

  private deserialize(data: Record<string, unknown>): UserPreferences {
    const requiredString = (value: unknown): string =>
      typeof value === "string" ? value : String(value ?? "");
    const requiredBoolean = (value: unknown): boolean =>
      value === true || requiredString(value) === "true";

    return {
      userId: requiredString(data.userId),
      theme: requiredString(data.theme) as UserPreferences["theme"],
      language: requiredString(data.language) as UserPreferences["language"],
      timezone: requiredString(data.timezone),
      inAppNotifications: requiredBoolean(data.inAppNotifications),
      telegramNotifications: requiredBoolean(data.telegramNotifications),
      clinicalReminders: requiredBoolean(data.clinicalReminders),
      createdAt: requiredString(data.createdAt),
      updatedAt: requiredString(data.updatedAt),
    };
  }
}
