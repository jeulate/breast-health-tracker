export type ProfilePhotoErrorCode =
  | "EMPTY_FILE"
  | "FILE_TOO_LARGE"
  | "UNSUPPORTED_FILE_TYPE"
  | "INVALID_OWNER_ID"
  | "OWNER_NOT_FOUND"
  | "BLOB_CONFIGURATION_ERROR"
  | "STORAGE_ERROR";

export class ProfilePhotoError extends Error {
  constructor(
    public readonly code: ProfilePhotoErrorCode,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "ProfilePhotoError";
  }
}