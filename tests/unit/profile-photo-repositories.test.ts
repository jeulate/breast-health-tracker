import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Patient, User } from "@/types";

const mocks = vi.hoisted(() => {
  const pipeline = {
    hset: vi.fn(),
    hdel: vi.fn(),
    set: vi.fn(),
    sadd: vi.fn(),
    zadd: vi.fn(),
    exec: vi.fn(),
};

  return {
    pipeline,
    redis: {
      hgetall: vi.fn(),
      hset: vi.fn(),
      get: vi.fn(),
      pipeline: vi.fn(() => pipeline),
    },
  };
});

vi.mock("@/lib/redis/client", () => ({
  getRedisClient: () => mocks.redis,
}));

vi.mock("@/config/env", () => ({
  getServerEnv: () => ({
    HEALTH_APP_REDIS_PREFIX: "bht:test:",
  }),
}));

import { PatientRepository } from "@/repositories/patient.repository";
import { UserRepository } from "@/repositories/user.repository";

const user: User = {
  id: "user-1",
  name: "Usuario de prueba",
  email: "user@example.com",
  passwordHash: "hashed-password",
  role: "PROFESSIONAL",
  status: "ACTIVE",
  profilePhotoPath: "users/user-1/profile/photo.webp",
  createdAt: "2026-07-24T12:00:00.000Z",
  updatedAt: "2026-07-24T12:00:00.000Z",
};

const patient: Patient = {
  id: "patient-1",
  fullName: "Paciente de prueba",
  timezone: "America/La_Paz",
  status: "ACTIVE",
  profilePhotoPath: "patients/patient-1/profile/photo.webp",
  createdAt: "2026-07-24T12:00:00.000Z",
  updatedAt: "2026-07-24T12:00:00.000Z",
};

describe("profile photo persistence", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.pipeline.exec.mockResolvedValue([]);
  });

  it("serializes a user profile photo path", async () => {
    await new UserRepository().save(user);

    expect(mocks.pipeline.hset).toHaveBeenCalledWith(
      "bht:test:users:user-1",
      expect.objectContaining({
        profilePhotoPath: "users/user-1/profile/photo.webp",
      }),
    );
  });

  it("deserializes a user profile photo path", async () => {
    mocks.redis.hgetall.mockResolvedValue({
      ...user,
    });

    await expect(
      new UserRepository().findById(user.id),
    ).resolves.toEqual(user);
  });

  it("keeps old user records compatible without a photo", async () => {
    const userWithoutPhoto = { ...user };
    delete userWithoutPhoto.profilePhotoPath;
    mocks.redis.hgetall.mockResolvedValue(userWithoutPhoto);

    await expect(
      new UserRepository().findById(user.id),
    ).resolves.toEqual({
      ...userWithoutPhoto,
      profilePhotoPath: undefined,
    });
  });

  it("updates and removes a user profile photo path", async () => {
    const repository = new UserRepository();

    await repository.updateProfilePhoto(
      user.id,
      "users/user-1/profile/new-photo.webp",
    );

    expect(mocks.redis.hset).toHaveBeenCalledWith(
      "bht:test:users:user-1",
      expect.objectContaining({
        profilePhotoPath: "users/user-1/profile/new-photo.webp",
      }),
    );

    await repository.updateProfilePhoto(user.id, null);

    expect(mocks.pipeline.hdel).toHaveBeenCalledWith(
      "bht:test:users:user-1",
      "profilePhotoPath",
    );
    expect(mocks.pipeline.exec).toHaveBeenCalledOnce();
  });

  it("serializes a patient profile photo path", async () => {
    await new PatientRepository().save(patient);

    expect(mocks.pipeline.hset).toHaveBeenCalledWith(
      "bht:test:patients:patient-1",
      expect.objectContaining({
        profilePhotoPath: "patients/patient-1/profile/photo.webp",
      }),
    );
  });

  it("deserializes a patient profile photo path", async () => {
    mocks.redis.hgetall.mockResolvedValue({
      ...patient,
    });

    await expect(
      new PatientRepository().findById(patient.id),
    ).resolves.toEqual(patient);
  });

  it("keeps old patient records compatible without a photo", async () => {
    const patientWithoutPhoto = { ...patient };
    delete patientWithoutPhoto.profilePhotoPath;
    mocks.redis.hgetall.mockResolvedValue(patientWithoutPhoto);

    await expect(
      new PatientRepository().findById(patient.id),
    ).resolves.toEqual({
      ...patientWithoutPhoto,
      profilePhotoPath: undefined,
    });
  });

  it("updates and removes a patient profile photo path", async () => {
    const repository = new PatientRepository();

    await repository.updateProfilePhoto(
      patient.id,
      "patients/patient-1/profile/new-photo.webp",
    );

    expect(mocks.redis.hset).toHaveBeenCalledWith(
      "bht:test:patients:patient-1",
      expect.objectContaining({
        profilePhotoPath: "patients/patient-1/profile/new-photo.webp",
      }),
    );

    await repository.updateProfilePhoto(patient.id, null);

    expect(mocks.pipeline.hdel).toHaveBeenCalledWith(
      "bht:test:patients:patient-1",
      "profilePhotoPath",
    );
    expect(mocks.pipeline.exec).toHaveBeenCalledOnce();
  });
});