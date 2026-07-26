export const PROFILE_PHOTO_MAX_SIZE_BYTES = 5 * 1024 * 1024;

export const PROFILE_PHOTO_ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export type ProfilePhotoMimeType = (typeof PROFILE_PHOTO_ALLOWED_TYPES)[number];

export type ProfilePhotoOwnerType = "users" | "patients";

export interface ProfilePhotoUpload {
  body: Blob;
  contentType: ProfilePhotoMimeType;
  size: number;
}

export interface StoredProfilePhoto {
  pathname: string;
  contentType: string;
  size: number;
}

export interface DownloadedProfilePhoto {
  body: ReadableStream<Uint8Array>;
  contentType: string;
  size: number | null;
}

export interface ProfilePhotoStorage {
  upload(
    ownerType: ProfilePhotoOwnerType,
    ownerId: string,
    photo: ProfilePhotoUpload,
  ): Promise<StoredProfilePhoto>;

  download(pathname: string): Promise<DownloadedProfilePhoto | null>;

  remove(pathname: string): Promise<void>;
}

export interface ProfilePhotoMutationResult {
  pathname: string | null;
  previousPhotoCleanupFailed: boolean;
}
