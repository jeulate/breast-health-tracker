import {
  parseProfilePhotoUpload,
  toProfilePhotoDownloadResponse,
  toProfilePhotoErrorResponse,
  toProfilePhotoMutationData,
} from "@/features/profile-photo/api/profile-photo-api";
import { ProfilePhotoService } from "@/features/profile-photo/profile-photo.service";
import { getSession } from "@/lib/auth/session";
import { fail, ok, toJsonResponse } from "@/lib/utils/api-response";

interface Params {
  params: Promise<{ id: string }>;
}

const profilePhotoService = new ProfilePhotoService();

export async function GET(_request: Request, { params }: Params): Promise<Response> {
  const session = await getSession();

  if (!session) {
    return toJsonResponse(fail("UNAUTHENTICATED", "Not authenticated"), 401);
  }

  try {
    const { id } = await params;
    const photo = await profilePhotoService.download("patients", id);

    if (!photo) {
      return toJsonResponse(
        fail("PHOTO_NOT_FOUND", "La paciente no tiene una fotografía de perfil."),
        404,
      );
    }

    return toProfilePhotoDownloadResponse(photo);
  } catch (error) {
    return toProfilePhotoErrorResponse(error);
  }
}

export async function POST(request: Request, { params }: Params): Promise<Response> {
  const session = await getSession();

  if (!session) {
    return toJsonResponse(fail("UNAUTHENTICATED", "Not authenticated"), 401);
  }

  try {
    const { id } = await params;
    const photo = await parseProfilePhotoUpload(request);
    const result = await profilePhotoService.replace("patients", id, photo);

    return toJsonResponse(ok(toProfilePhotoMutationData(result)));
  } catch (error) {
    return toProfilePhotoErrorResponse(error);
  }
}

export async function DELETE(_request: Request, { params }: Params): Promise<Response> {
  const session = await getSession();

  if (!session) {
    return toJsonResponse(fail("UNAUTHENTICATED", "Not authenticated"), 401);
  }

  try {
    const { id } = await params;
    const result = await profilePhotoService.remove("patients", id);

    return toJsonResponse(ok(toProfilePhotoMutationData(result)));
  } catch (error) {
    return toProfilePhotoErrorResponse(error);
  }
}
