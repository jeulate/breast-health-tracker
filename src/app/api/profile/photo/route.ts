import {
  parseProfilePhotoUpload,
  toProfilePhotoDownloadResponse,
  toProfilePhotoErrorResponse,
  toProfilePhotoMutationData,
} from "@/features/profile-photo/api/profile-photo-api";
import { ProfilePhotoService } from "@/features/profile-photo/profile-photo.service";
import { getSession } from "@/lib/auth/session";
import { fail, ok, toJsonResponse } from "@/lib/utils/api-response";

const profilePhotoService = new ProfilePhotoService();

export async function GET(): Promise<Response> {
  const session = await getSession();

  if (!session) {
    return toJsonResponse(fail("UNAUTHENTICATED", "Not authenticated"), 401);
  }

  try {
    const photo = await profilePhotoService.download("users", session.sub);

    if (!photo) {
      return toJsonResponse(
        fail("PHOTO_NOT_FOUND", "El usuario no tiene una fotografía de perfil."),
        404,
      );
    }

    return toProfilePhotoDownloadResponse(photo);
  } catch (error) {
    return toProfilePhotoErrorResponse(error);
  }
}

export async function POST(request: Request): Promise<Response> {
  const session = await getSession();

  if (!session) {
    return toJsonResponse(fail("UNAUTHENTICATED", "Not authenticated"), 401);
  }

  try {
    const photo = await parseProfilePhotoUpload(request);
    const result = await profilePhotoService.replace("users", session.sub, photo);

    return toJsonResponse(ok(toProfilePhotoMutationData(result)));
  } catch (error) {
    return toProfilePhotoErrorResponse(error);
  }
}

export async function DELETE(): Promise<Response> {
  const session = await getSession();

  if (!session) {
    return toJsonResponse(fail("UNAUTHENTICATED", "Not authenticated"), 401);
  }

  try {
    const result = await profilePhotoService.remove("users", session.sub);

    return toJsonResponse(ok(toProfilePhotoMutationData(result)));
  } catch (error) {
    return toProfilePhotoErrorResponse(error);
  }
}
