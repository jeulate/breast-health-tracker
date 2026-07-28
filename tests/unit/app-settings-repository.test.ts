import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AppSettings } from "@/features/admin-settings";

const mocks = vi.hoisted(() => ({
  redis: {
    hgetall: vi.fn(),
    hset: vi.fn(),
  },
}));

vi.mock("@/lib/redis/client", () => ({
  getRedisClient: () => mocks.redis,
}));

vi.mock("@/config/env", () => ({
  getServerEnv: () => ({
    HEALTH_APP_REDIS_PREFIX: "bht:test:",
  }),
}));

import { AppSettingsRepository } from "@/repositories/app-settings.repository";

const settings: AppSettings = {
  appName: "BI-RADS Tracker",
  defaultTimezone: "America/La_Paz",
  userProfilePhotosEnabled: true,
  patientProfilePhotosEnabled: false,
  profilePhotoMaxSizeMb: 5,
  createdAt: "2026-07-28T12:00:00.000Z",
  updatedAt: "2026-07-28T13:00:00.000Z",
  updatedBy: "admin-1",
};

function serialized(value: AppSettings): Record<string, string | number | boolean> {
  return {
    appName: value.appName,
    defaultTimezone: value.defaultTimezone,
    userProfilePhotosEnabled: String(value.userProfilePhotosEnabled),
    patientProfilePhotosEnabled: String(value.patientProfilePhotosEnabled),
    profilePhotoMaxSizeMb: String(value.profilePhotoMaxSizeMb),
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
    updatedBy: value.updatedBy ?? "",
  };
}

describe("AppSettingsRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.redis.hset.mockResolvedValue(1);
  });

  it("returns null when application settings do not exist", async () => {
    mocks.redis.hgetall.mockResolvedValue(null);

    await expect(new AppSettingsRepository().find()).resolves.toBeNull();

    expect(mocks.redis.hgetall).toHaveBeenCalledWith("bht:test:settings:application");
  });

  it("returns null when Redis returns an empty hash", async () => {
    mocks.redis.hgetall.mockResolvedValue({});

    await expect(new AppSettingsRepository().find()).resolves.toBeNull();
  });

  it("deserializes settings returned by Redis", async () => {
    mocks.redis.hgetall.mockResolvedValue(serialized(settings));

    await expect(new AppSettingsRepository().find()).resolves.toEqual(settings);
  });

  it("deserializes boolean and numeric native values returned by Upstash", async () => {
    mocks.redis.hgetall.mockResolvedValue({
      ...serialized(settings),
      userProfilePhotosEnabled: true,
      patientProfilePhotosEnabled: false,
      profilePhotoMaxSizeMb: 7,
    });

    await expect(new AppSettingsRepository().find()).resolves.toEqual({
      ...settings,
      profilePhotoMaxSizeMb: 7,
    });
  });

  it("converts an empty updatedBy value to null", async () => {
    mocks.redis.hgetall.mockResolvedValue({
      ...serialized(settings),
      updatedBy: "",
    });

    await expect(new AppSettingsRepository().find()).resolves.toEqual({
      ...settings,
      updatedBy: null,
    });
  });

  it("serializes and saves application settings", async () => {
    await new AppSettingsRepository().save(settings);

    expect(mocks.redis.hset).toHaveBeenCalledWith(
      "bht:test:settings:application",
      serialized(settings),
    );
  });

  it("serializes a null updatedBy value as an empty string", async () => {
    await new AppSettingsRepository().save({
      ...settings,
      updatedBy: null,
    });

    expect(mocks.redis.hset).toHaveBeenCalledWith(
      "bht:test:settings:application",
      expect.objectContaining({
        updatedBy: "",
      }),
    );
  });
});
