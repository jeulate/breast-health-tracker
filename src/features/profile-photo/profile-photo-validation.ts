import {
  PROFILE_PHOTO_ALLOWED_TYPES,
  PROFILE_PHOTO_MAX_SIZE_BYTES,
  type ProfilePhotoMimeType,
  type ProfilePhotoUpload,
} from "./profile-photo.types";
import { ProfilePhotoError } from "./profile-photo.errors";

export interface ProfilePhotoFileLike {
  size: number;
  type: string;
  arrayBuffer(): Promise<ArrayBuffer>;
}

export function isProfilePhotoMimeType(contentType: string): contentType is ProfilePhotoMimeType {
  return PROFILE_PHOTO_ALLOWED_TYPES.some((allowedType) => allowedType === contentType);
}

export async function validateProfilePhoto(
  file: ProfilePhotoFileLike,
): Promise<ProfilePhotoUpload> {
  if (file.size <= 0) {
    throw new ProfilePhotoError("EMPTY_FILE", "The profile photo cannot be empty.");
  }

  if (file.size > PROFILE_PHOTO_MAX_SIZE_BYTES) {
    throw new ProfilePhotoError("FILE_TOO_LARGE", "The profile photo cannot exceed 5 MB.");
  }

  if (!isProfilePhotoMimeType(file.type)) {
    throw new ProfilePhotoError(
      "UNSUPPORTED_FILE_TYPE",
      "Only JPEG, PNG and WebP profile photos are allowed.",
    );
  }

  const buffer = await file.arrayBuffer();

  return {
    body: new Blob([buffer], { type: file.type }),
    contentType: file.type,
    size: file.size,
  };
}
