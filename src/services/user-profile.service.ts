import type {
  UpdateUserProfileInput,
  UserPreferences,
  UserProfile,
} from "@/features/profile";
import { updateUserProfileSchema } from "@/lib/validations/profile";
import { UserPreferencesRepository } from "@/repositories/user-preferences.repository";
import { UserRepository } from "@/repositories/user.repository";

const userRepository = new UserRepository();
const preferencesRepository = new UserPreferencesRepository();

function defaultPreferences(userId: string, now: string): UserPreferences {
  return {
    userId,
    theme: "SYSTEM",
    language: "es",
    timezone: "America/La_Paz",
    inAppNotifications: true,
    telegramNotifications: true,
    clinicalReminders: true,
    createdAt: now,
    updatedAt: now,
  };
}

export const UserProfileService = {
  async get(userId: string): Promise<UserProfile | null> {
    const user = await userRepository.findById(userId);
    if (!user || user.status !== "ACTIVE") return null;

    let preferences = await preferencesRepository.findByUserId(userId);
    if (!preferences) {
      preferences = defaultPreferences(userId, new Date().toISOString());
      await preferencesRepository.save(preferences);
    }

    const { passwordHash: _passwordHash, ...publicUser } = user;
    void _passwordHash;
    return { user: publicUser, preferences };
  },

  async update(userId: string, input: UpdateUserProfileInput): Promise<UserProfile | null> {
    const parsed = updateUserProfileSchema.parse(input);
    const existing = await this.get(userId);
    if (!existing) return null;

    if (parsed.name !== undefined) {
      await userRepository.updateProfile(userId, { name: parsed.name });
    }

    const { name: _name, ...preferenceFields } = parsed;
    void _name;
    if (Object.keys(preferenceFields).length > 0) {
      await preferencesRepository.save({
        ...existing.preferences,
        ...preferenceFields,
        updatedAt: new Date().toISOString(),
      });
    }

    return this.get(userId);
  },
};
