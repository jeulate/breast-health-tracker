import { beforeEach, describe, expect, it, vi } from "vitest";

import { ProfilePhotoError } from "@/features/profile-photo/profile-photo.errors";
import { ProfilePhotoService } from "@/features/profile-photo/profile-photo.service";
import type {
  ProfilePhotoStorage,
  ProfilePhotoUpload,
} from "@/features/profile-photo/profile-photo.types";
import type { Patient, User } from "@/types";

describe("ProfilePhotoService", () => {
  const storage: ProfilePhotoStorage = {
    upload: vi.fn(),
    download: vi.fn(),
    remove: vi.fn(),
  };

  const users = {
    findById: vi.fn(),
    updateProfilePhoto: vi.fn(),
  };

  const patients = {
    findById: vi.fn(),
    updateProfilePhoto: vi.fn(),
  };

  const photo: ProfilePhotoUpload = {
    body: new Blob(["new-photo"], { type: "image/jpeg" }),
    contentType: "image/jpeg",
    size: 9,
  };

  const uploadedPhoto = {
    pathname: "profile-photos/users/user-1/new-photo.jpg",
    contentType: "image/jpeg",
    size: 9,
  };

  const user = {
    id: "user-1",
    profilePhotoPath:
      "profile-photos/users/user-1/previous-photo.jpg",
  } as User;

  const patient = {
    id: "patient-1",
    profilePhotoPath:
      "profile-photos/patients/patient-1/previous-photo.jpg",
  } as Patient;

  const createService = () =>
    new ProfilePhotoService({
      storage,
      users,
      patients,
    });

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(storage.upload).mockResolvedValue(uploadedPhoto);
    vi.mocked(storage.remove).mockResolvedValue(undefined);

    users.findById.mockResolvedValue(user);
    users.updateProfilePhoto.mockResolvedValue(undefined);

    patients.findById.mockResolvedValue(patient);
    patients.updateProfilePhoto.mockResolvedValue(undefined);
  });

  it("replaces a user profile photo and removes the previous one", async () => {
    const service = createService();

    const result = await service.replace(
      "users",
      "user-1",
      photo,
    );

    expect(users.findById).toHaveBeenCalledWith("user-1");
    expect(storage.upload).toHaveBeenCalledWith(
      "users",
      "user-1",
      photo,
    );
    expect(users.updateProfilePhoto).toHaveBeenCalledWith(
      "user-1",
      uploadedPhoto.pathname,
    );
    expect(storage.remove).toHaveBeenCalledWith(
      user.profilePhotoPath,
    );
    expect(result).toEqual({
      pathname: uploadedPhoto.pathname,
      previousPhotoCleanupFailed: false,
    });
  });

  it("replaces a patient profile photo using the patient repository", async () => {
    const patientUpload = {
      ...uploadedPhoto,
      pathname:
        "profile-photos/patients/patient-1/new-photo.jpg",
    };

    vi.mocked(storage.upload).mockResolvedValue(patientUpload);

    const service = createService();

    const result = await service.replace(
      "patients",
      "patient-1",
      photo,
    );

    expect(patients.findById).toHaveBeenCalledWith(
      "patient-1",
    );
    expect(users.findById).not.toHaveBeenCalled();
    expect(patients.updateProfilePhoto).toHaveBeenCalledWith(
      "patient-1",
      patientUpload.pathname,
    );
    expect(storage.remove).toHaveBeenCalledWith(
      patient.profilePhotoPath,
    );
    expect(result.pathname).toBe(patientUpload.pathname);
  });

  it("rejects replacement when the owner does not exist", async () => {
    users.findById.mockResolvedValue(null);

    const service = createService();

    const operation = service.replace(
      "users",
      "missing-user",
      photo,
    );

    await expect(operation).rejects.toMatchObject({
      code: "OWNER_NOT_FOUND",
    } satisfies Partial<ProfilePhotoError>);

    expect(storage.upload).not.toHaveBeenCalled();
    expect(users.updateProfilePhoto).not.toHaveBeenCalled();
  });

  it("removes the newly uploaded photo when persistence fails", async () => {
    const persistenceError = new Error("Redis unavailable");

    users.updateProfilePhoto.mockRejectedValue(
      persistenceError,
    );

    const service = createService();

    await expect(
      service.replace("users", "user-1", photo),
    ).rejects.toBe(persistenceError);

    expect(storage.remove).toHaveBeenCalledTimes(1);
    expect(storage.remove).toHaveBeenCalledWith(
      uploadedPhoto.pathname,
    );
    expect(storage.remove).not.toHaveBeenCalledWith(
      user.profilePhotoPath,
    );
  });

  it("preserves the persistence error when compensation cleanup also fails", async () => {
    const persistenceError = new Error("Redis unavailable");

    users.updateProfilePhoto.mockRejectedValue(
      persistenceError,
    );
    vi.mocked(storage.remove).mockRejectedValue(
      new Error("Blob unavailable"),
    );

    const service = createService();

    await expect(
      service.replace("users", "user-1", photo),
    ).rejects.toBe(persistenceError);
  });

  it("reports a non-blocking failure when the previous photo cannot be removed", async () => {
    vi.mocked(storage.remove).mockRejectedValue(
      new Error("Blob unavailable"),
    );

    const service = createService();

    const result = await service.replace(
      "users",
      "user-1",
      photo,
    );

    expect(result).toEqual({
      pathname: uploadedPhoto.pathname,
      previousPhotoCleanupFailed: true,
    });
    expect(users.updateProfilePhoto).toHaveBeenCalledWith(
      "user-1",
      uploadedPhoto.pathname,
    );
  });

  it("removes the profile photo reference before deleting the stored file", async () => {
    const callOrder: string[] = [];

    users.updateProfilePhoto.mockImplementation(async () => {
      callOrder.push("persistence");
    });

    vi.mocked(storage.remove).mockImplementation(async () => {
      callOrder.push("storage");
    });

    const service = createService();

    const result = await service.remove(
      "users",
      "user-1",
    );

    expect(users.updateProfilePhoto).toHaveBeenCalledWith(
      "user-1",
      null,
    );
    expect(storage.remove).toHaveBeenCalledWith(
      user.profilePhotoPath,
    );
    expect(callOrder).toEqual(["persistence", "storage"]);
    expect(result).toEqual({
      pathname: null,
      previousPhotoCleanupFailed: false,
    });
  });

  it("does nothing when the owner has no profile photo", async () => {
    users.findById.mockResolvedValue({
      ...user,
      profilePhotoPath: undefined,
    });

    const service = createService();

    const result = await service.remove(
      "users",
      "user-1",
    );

    expect(users.updateProfilePhoto).not.toHaveBeenCalled();
    expect(storage.remove).not.toHaveBeenCalled();
    expect(result).toEqual({
      pathname: null,
      previousPhotoCleanupFailed: false,
    });
  });

  it("does not delete the stored photo when removing its reference fails", async () => {
    const persistenceError = new Error("Redis unavailable");

    users.updateProfilePhoto.mockRejectedValue(
      persistenceError,
    );

    const service = createService();

    await expect(
      service.remove("users", "user-1"),
    ).rejects.toBe(persistenceError);

    expect(storage.remove).not.toHaveBeenCalled();
  });

  it("reports cleanup failure after removing the persisted reference", async () => {
    vi.mocked(storage.remove).mockRejectedValue(
      new Error("Blob unavailable"),
    );

    const service = createService();

    const result = await service.remove(
      "users",
      "user-1",
    );

    expect(users.updateProfilePhoto).toHaveBeenCalledWith(
      "user-1",
      null,
    );
    expect(result).toEqual({
      pathname: null,
      previousPhotoCleanupFailed: true,
    });
  });
});