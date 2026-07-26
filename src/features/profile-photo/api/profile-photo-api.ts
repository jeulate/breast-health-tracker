import { ProfilePhotoError } from "../profile-photo.errors";
import type {
  DownloadedProfilePhoto,
  ProfilePhotoMutationResult,
  ProfilePhotoUpload,
} from "../profile-photo.types";
import { validateProfilePhoto } from "../profile-photo-validation";
import { fail, toJsonResponse } from "@/lib/utils/api-response";

const VALIDATION_ERROR_CODES = new Set([
  "EMPTY_FILE",
  "FILE_TOO_LARGE",
  "UNSUPPORTED_FILE_TYPE",
  "INVALID_OWNER_ID",
]);

export async function parseProfilePhotoUpload(
  request: Request,
): Promise<ProfilePhotoUpload> {
  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    throw new ProfilePhotoError(
      "EMPTY_FILE",
      "The request must contain a profile photo.",
    );
  }

  const photo = formData.get("photo");

  if (!(photo instanceof Blob)) {
    throw new ProfilePhotoError(
      "EMPTY_FILE",
      "The photo field is required.",
    );
  }

  return validateProfilePhoto(photo);
}

export function toProfilePhotoErrorResponse(
  error: unknown,
): Response {
  if (!(error instanceof ProfilePhotoError)) {
    return toJsonResponse(
      fail(
        "INTERNAL_ERROR",
        "No fue posible procesar la fotografía.",
      ),
      500,
    );
  }

  if (VALIDATION_ERROR_CODES.has(error.code)) {
    return toJsonResponse(
      fail(error.code, error.message),
      400,
    );
  }

  if (error.code === "OWNER_NOT_FOUND") {
    return toJsonResponse(
      fail(error.code, error.message),
      404,
    );
  }

  return toJsonResponse(
    fail(error.code, error.message),
    500,
  );
}

export function toProfilePhotoDownloadResponse(
  photo: DownloadedProfilePhoto,
): Response {
  const headers = new Headers({
    "Content-Type": photo.contentType,
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff",
  });

  if (photo.size !== null) {
    headers.set("Content-Length", String(photo.size));
  }

  return new Response(photo.body, {
    status: 200,
    headers,
  });
}

export function toProfilePhotoMutationData(
  result: ProfilePhotoMutationResult,
) {
  return {
    hasPhoto: result.pathname !== null,
    previousPhotoCleanupFailed:
      result.previousPhotoCleanupFailed,
  };
}