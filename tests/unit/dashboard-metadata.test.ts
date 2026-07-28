import { beforeEach, describe, expect, it, vi } from "vitest";

const { getSettingsMock } = vi.hoisted(() => ({
  getSettingsMock: vi.fn(),
}));

vi.mock("@/services/admin-settings.service", () => ({
  adminSettingsService: {
    getSettings: getSettingsMock,
  },
}));

vi.mock("@/lib/auth/session", () => ({
  getSession: vi.fn(),
}));

vi.mock("@/services/user-profile.service", () => ({
  UserProfileService: {
    get: vi.fn(),
  },
}));

import { generateMetadata } from "@/app/dashboard/layout";

describe("dashboard generateMetadata", () => {
  beforeEach(() => {
    getSettingsMock.mockReset();
  });

  it("utiliza el nombre configurado en el título y la plantilla", async () => {
    getSettingsMock.mockResolvedValue({
      appName: "Seguimiento BI-RADS",
      defaultTimezone: "America/La_Paz",
      userProfilePhotosEnabled: true,
      patientProfilePhotosEnabled: true,
      profilePhotoMaxSizeMb: 5,
      createdAt: "2026-07-28T12:00:00.000Z",
      updatedAt: "2026-07-28T12:00:00.000Z",
      updatedBy: "admin-1",
    });

    await expect(generateMetadata()).resolves.toMatchObject({
      title: {
        default: "Seguimiento BI-RADS",
        template: "%s | Seguimiento BI-RADS",
      },
    });
  });

  it("utiliza el nombre predeterminado cuando la configuración no está disponible", async () => {
    getSettingsMock.mockRejectedValue(new Error("Redis unavailable"));

    await expect(generateMetadata()).resolves.toMatchObject({
      title: {
        default: "BI-RADS Tracker",
        template: "%s | BI-RADS Tracker",
      },
    });
  });

  it("utiliza el nombre predeterminado cuando el valor está vacío", async () => {
    getSettingsMock.mockResolvedValue({
      appName: "   ",
    });

    await expect(generateMetadata()).resolves.toMatchObject({
      title: {
        default: "BI-RADS Tracker",
        template: "%s | BI-RADS Tracker",
      },
    });
  });
});
