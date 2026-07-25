import { del, get, put } from "@vercel/blob";

import { getBlobEnv } from "./blob-env";
import { ProfilePhotoError } from "./profile-photo.errors";
import type {
  DownloadedProfilePhoto,
  ProfilePhotoMimeType,
  ProfilePhotoOwnerType,
  ProfilePhotoStorage,
  ProfilePhotoUpload,
  StoredProfilePhoto,
} from "./profile-photo.types";

const PROFILE_PHOTO_PATH_PREFIX = "profile-photos";

const CONTENT_TYPE_EXTENSIONS: Record<ProfilePhotoMimeType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function validateOwnerId(ownerId: string): void {
  if (
    ownerId.length === 0 ||
    ownerId.length > 128 ||
    !/^[a-zA-Z0-9_-]+$/.test(ownerId)
  ) {
    throw new ProfilePhotoError(
      "INVALID_OWNER_ID",
      "The profile photo owner ID is invalid.",
    );
  }
}

function createProfilePhotoPathname(
  ownerType: ProfilePhotoOwnerType,
  ownerId: string,
  contentType: ProfilePhotoMimeType,
): string {
  validateOwnerId(ownerId);

  const extension = CONTENT_TYPE_EXTENSIONS[contentType];
  const photoId = crypto.randomUUID();

  return [
    PROFILE_PHOTO_PATH_PREFIX,
    ownerType,
    ownerId,
    `${photoId}.${extension}`,
  ].join("/");
}

function toStorageError(
  message: string,
  cause: unknown,
): ProfilePhotoError {
  if (cause instanceof ProfilePhotoError) {
    return cause;
  }

  return new ProfilePhotoError("STORAGE_ERROR", message, { cause });
}

export class VercelBlobProfilePhotoStorage
  implements ProfilePhotoStorage
{
  async upload(
    ownerType: ProfilePhotoOwnerType,
    ownerId: string,
    photo: ProfilePhotoUpload,
  ): Promise<StoredProfilePhoto> {
    try {
      const { BLOB_READ_WRITE_TOKEN } = getBlobEnv();

      const pathname = createProfilePhotoPathname(
        ownerType,
        ownerId,
        photo.contentType,
      );

      const result = await put(pathname, photo.body, {
        access: "private",
        token: BLOB_READ_WRITE_TOKEN,
        contentType: photo.contentType,
        maximumSizeInBytes: photo.size,
      });

      return {
        pathname: result.pathname,
        contentType: photo.contentType,
        size: photo.size,
      };
    } catch (error) {
      throw toStorageError(
        "The profile photo could not be uploaded.",
        error,
      );
    }
  }

  async download(
  pathname: string,
    ): Promise<DownloadedProfilePhoto | null> {
    try {
        const { BLOB_READ_WRITE_TOKEN } = getBlobEnv();

        const result = await get(pathname, {
        access: "private",
        token: BLOB_READ_WRITE_TOKEN,
        });

        if (result === null) {
        return null;
        }

        if (result.statusCode !== 200 || result.stream === null) {
        return null;
        }

        return {
        body: result.stream,
        contentType: result.blob.contentType,
        size: result.blob.size,
        };
    } catch (error) {
        throw toStorageError(
        "The profile photo could not be downloaded.",
        error,
        );
    }
}

  async remove(pathname: string): Promise<void> {
    try {
      const { BLOB_READ_WRITE_TOKEN } = getBlobEnv();

      await del(pathname, {
        token: BLOB_READ_WRITE_TOKEN,
      });
    } catch (error) {
      throw toStorageError(
        "The profile photo could not be removed.",
        error,
      );
    }
  }
}