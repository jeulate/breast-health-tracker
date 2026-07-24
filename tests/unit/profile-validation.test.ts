import { describe, expect, it } from "vitest";
import { updateUserProfileSchema } from "@/lib/validations/profile";

describe("updateUserProfileSchema", () => {
  it("accepts supported profile and preference fields", () => {
    const result = updateUserProfileSchema.safeParse({
      name: "Administrador",
      theme: "DARK",
      language: "es",
      timezone: "America/La_Paz",
      inAppNotifications: true,
      telegramNotifications: false,
      clinicalReminders: true,
    });

    expect(result.success).toBe(true);
  });

  it("rejects an empty update", () => {
    expect(updateUserProfileSchema.safeParse({}).success).toBe(false);
  });

  it("rejects unknown or sensitive fields", () => {
    expect(
      updateUserProfileSchema.safeParse({
        name: "Administrador",
        role: "ADMIN",
        passwordHash: "not-allowed",
      }).success,
    ).toBe(false);
  });

  it("rejects an invalid timezone", () => {
    expect(
      updateUserProfileSchema.safeParse({ timezone: "Invalid/Timezone" }).success,
    ).toBe(false);
  });
});
