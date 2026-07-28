import { authorize } from "@/features/auth";
import {
  parseProfilePhotoUpload,
  toProfilePhotoDownloadResponse,
  toProfilePhotoErrorResponse,
  toProfilePhotoMutationData,
} from "@/features/profile-photo/api/profile-photo-api";
import { ProfilePhotoService } from "@/features/profile-photo/profile-photo.service";
import { fail, ok, toJsonResponse } from "@/lib/utils/api-response";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

const profilePhotoService = new ProfilePhotoService();

function authorizationFailure(reason: "UNAUTHORIZED" | "FORBIDDEN") {
  if (reason === "UNAUTHORIZED") {
    return toJsonResponse(fail("UNAUTHORIZED", "Debes iniciar sesión."), 401);
  }

  return toJsonResponse(fail("FORBIDDEN", "No tienes permisos para gestionar usuarios."), 403);
}

export async function GET(_request: Request, context: RouteContext): Promise<Response> {
  try {
    const authorization = await authorize("users:manage");

    if (!authorization.authorized) {
      return authorizationFailure(authorization.reason);
    }

    const { id } = await context.params;
    const photo = await profilePhotoService.download("users", id);

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

export async function POST(request: Request, context: RouteContext): Promise<Response> {
  try {
    const authorization = await authorize("users:manage");

    if (!authorization.authorized) {
      return authorizationFailure(authorization.reason);
    }

    const { id } = await context.params;
    const photo = await parseProfilePhotoUpload(request);

    const result = await profilePhotoService.replace("users", id, photo);

    return toJsonResponse(ok(toProfilePhotoMutationData(result)));
  } catch (error) {
    return toProfilePhotoErrorResponse(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext): Promise<Response> {
  try {
    const authorization = await authorize("users:manage");

    if (!authorization.authorized) {
      return authorizationFailure(authorization.reason);
    }

    const { id } = await context.params;
    const result = await profilePhotoService.remove("users", id);

    return toJsonResponse(ok(toProfilePhotoMutationData(result)));
  } catch (error) {
    return toProfilePhotoErrorResponse(error);
  }
}
