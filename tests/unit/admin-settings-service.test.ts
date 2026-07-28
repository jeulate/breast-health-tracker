import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AppSettings } from "@/features/admin-settings";

const mocks = vi.hoisted(() => ({
  find: vi.fn(),
  save: vi.fn(),
}));

vi.mock("@/repositories/app-settings.repository", () => ({
  AppSettingsRepository: class {
    find = mocks.find;
    save = mocks.save;
  },
  appSettingsRepository: {
    find: mocks.find,
    save: mocks.save,
  },
}));

import { AdminSettingsService } from "@/services/admin-settings.service";

const storedSettings: AppSettings = {
  appName: "Seguimiento mamario",
  defaultTimezone: "America/La_Paz",
  userProfilePhotosEnabled: true,
  patientProfilePhotosEnabled: false,
  profilePhotoMaxSizeMb: 6,
  createdAt: "2026-07-27T12:00:00.000Z",
  updatedAt: "2026-07-27T13:00:00.000Z",
  updatedBy: "admin-1",
};

const updateInput = {
  appName: "BI-RADS Tracker",
  defaultTimezone: "America/La_Paz",
  userProfilePhotosEnabled: false,
  patientProfilePhotosEnabled: true,
  profilePhotoMaxSizeMb: 8,
};

describe("AdminSettingsService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.save.mockResolvedValue(undefined);
  });

  it("returns settings stored in Redis", async () => {
    mocks.find.mockResolvedValue(storedSettings);

    const result = await new AdminSettingsService().getSettings();

    expect(result).toEqual(storedSettings);
    expect(mocks.find).toHaveBeenCalledOnce();
    expect(mocks.save).not.toHaveBeenCalled();
  });

  it("returns defaults when settings have not been persisted", async () => {
    mocks.find.mockResolvedValue(null);

    const result = await new AdminSettingsService().getSettings();

    expect(result).toEqual(
      expect.objectContaining({
        appName: "BI-RADS Tracker",
        defaultTimezone: "America/La_Paz",
        userProfilePhotosEnabled: true,
        patientProfilePhotosEnabled: true,
        profilePhotoMaxSizeMb: 5,
        updatedBy: null,
      }),
    );
    expect(result.createdAt).toEqual(expect.any(String));
    expect(result.updatedAt).toEqual(expect.any(String));
    expect(result.createdAt).toBe(result.updatedAt);
    expect(mocks.save).not.toHaveBeenCalled();
  });

  it("updates settings while preserving their original creation date", async () => {
    mocks.find.mockResolvedValue(storedSettings);

    const result = await new AdminSettingsService().updateSettings(updateInput, "admin-2");

    expect(result).toEqual(
      expect.objectContaining({
        ...updateInput,
        createdAt: storedSettings.createdAt,
        updatedBy: "admin-2",
      }),
    );
    expect(result.updatedAt).toEqual(expect.any(String));
    expect(mocks.save).toHaveBeenCalledWith(result);
  });

  it("creates the audit dates when settings are saved for the first time", async () => {
    mocks.find.mockResolvedValue(null);

    const result = await new AdminSettingsService().updateSettings(updateInput, "admin-1");

    expect(result.createdAt).toEqual(expect.any(String));
    expect(result.updatedAt).toBe(result.createdAt);
    expect(result.updatedBy).toBe("admin-1");
    expect(mocks.save).toHaveBeenCalledWith(result);
  });

  it("propagates repository errors while retrieving settings", async () => {
    mocks.find.mockRejectedValue(new Error("Redis unavailable"));

    await expect(new AdminSettingsService().getSettings()).rejects.toThrow("Redis unavailable");
  });

  it("propagates repository errors while saving settings", async () => {
    mocks.find.mockResolvedValue(storedSettings);
    mocks.save.mockRejectedValue(new Error("Redis unavailable"));

    await expect(new AdminSettingsService().updateSettings(updateInput, "admin-2")).rejects.toThrow(
      "Redis unavailable",
    );
  });
});
