import { describe, expect, it, vi } from "vitest";

import { ProfilePhotoError } from "@/features/profile-photo/profile-photo.errors";
import {
  PROFILE_PHOTO_MAX_SIZE_BYTES,
} from "@/features/profile-photo/profile-photo.types";
import {
  validateProfilePhoto,
  type ProfilePhotoFileLike,
} from "@/features/profile-photo/profile-photo-validation";

function createFile(
  overrides: Partial<ProfilePhotoFileLike> = {},
): ProfilePhotoFileLike {
  return {
    size: 1024,
    type: "image/jpeg",
    arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(1024)),
    ...overrides,
  };
}

describe("validateProfilePhoto", () => {
  it.each(["image/jpeg", "image/png", "image/webp"])(
    "accepts %s",
    async (type) => {
      const result = await validateProfilePhoto(createFile({ type }));

      expect(result.contentType).toBe(type);
      expect(result.size).toBe(1024);
      expect(result.body).toBeInstanceOf(Blob);
    },
  );

  it("rejects an empty file", async () => {
    await expect(
      validateProfilePhoto(createFile({ size: 0 })),
    ).rejects.toMatchObject({
      code: "EMPTY_FILE",
    });
  });

  it("rejects a file larger than 5 MB", async () => {
    await expect(
      validateProfilePhoto(
        createFile({ size: PROFILE_PHOTO_MAX_SIZE_BYTES + 1 }),
      ),
    ).rejects.toMatchObject({
      code: "FILE_TOO_LARGE",
    });
  });

  it("rejects unsupported content types", async () => {
    await expect(
      validateProfilePhoto(createFile({ type: "image/gif" })),
    ).rejects.toMatchObject({
      code: "UNSUPPORTED_FILE_TYPE",
    });
  });

  it("does not read an invalid file", async () => {
    const arrayBuffer = vi.fn().mockResolvedValue(new ArrayBuffer(0));

    await expect(
      validateProfilePhoto(
        createFile({
          size: PROFILE_PHOTO_MAX_SIZE_BYTES + 1,
          arrayBuffer,
        }),
      ),
    ).rejects.toBeInstanceOf(ProfilePhotoError);

    expect(arrayBuffer).not.toHaveBeenCalled();
  });
});