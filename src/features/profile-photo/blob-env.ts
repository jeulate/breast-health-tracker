import { z } from "zod";

import { ProfilePhotoError } from "./profile-photo.errors";

const blobEnvSchema = z.object({
  BLOB_READ_WRITE_TOKEN: z
    .string()
    .min(1, "BLOB_READ_WRITE_TOKEN is required"),
});

export type BlobEnv = z.infer<typeof blobEnvSchema>;

let cachedBlobEnv: BlobEnv | null = null;

export function getBlobEnv(): BlobEnv {
  if (cachedBlobEnv) {
    return cachedBlobEnv;
  }

  const result = blobEnvSchema.safeParse(process.env);

  if (!result.success) {
    throw new ProfilePhotoError(
      "BLOB_CONFIGURATION_ERROR",
      "Private profile photo storage is not configured.",
      { cause: result.error },
    );
  }

  cachedBlobEnv = result.data;
  return cachedBlobEnv;
}

export function resetBlobEnvForTests(): void {
  cachedBlobEnv = null;
}