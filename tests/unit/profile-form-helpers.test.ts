import { describe, expect, it } from "vitest";
import {
  profileThemeToNextTheme,
  toProfileFormValues,
  toUpdateProfileInput,
} from "@/components/profile/profile-form.helpers";
import type { UserProfile } from "@/features/profile";

const profile: UserProfile = {
  user: {
    id: "user-1",
    name: "Juan Admin",
    email: "admin@example.com",
    role: "ADMIN",
    status: "ACTIVE",
    createdAt: "2026-07-01T12:00:00.000Z",
    updatedAt: "2026-07-01T12:00:00.000Z",
  },
  preferences: {
    userId: "user-1",
    theme: "SYSTEM",
    language: "es",
    timezone: "America/La_Paz",
    inAppNotifications: true,
    telegramNotifications: false,
    clinicalReminders: true,
    createdAt: "2026-07-01T12:00:00.000Z",
    updatedAt: "2026-07-01T12:00:00.000Z",
  },
};

describe("profile form helpers", () => {
  it("maps an API profile to editable values", () => {
    expect(toProfileFormValues(profile)).toEqual({
      name: "Juan Admin",
      theme: "SYSTEM",
      language: "es",
      timezone: "America/La_Paz",
      inAppNotifications: true,
      telegramNotifications: false,
      clinicalReminders: true,
    });
  });

  it("trims the name when building the update payload", () => {
    expect(
      toUpdateProfileInput({
        ...toProfileFormValues(profile),
        name: "  Juan Admin  ",
      }).name,
    ).toBe("Juan Admin");
  });

  it.each([
    ["LIGHT", "light"],
    ["DARK", "dark"],
    ["SYSTEM", "system"],
  ] as const)("maps %s to next-themes value %s", (source, expected) => {
    expect(profileThemeToNextTheme(source)).toBe(expected);
  });
});
