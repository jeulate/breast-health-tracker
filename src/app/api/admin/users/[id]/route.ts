import { authorize } from "@/features/auth";
import { updateAdminUserSchema } from "@/lib/validations/admin-user";
import { ok, fail, toJsonResponse } from "@/lib/utils/api-response";
import { AdminUserService } from "@/services/admin-user.service";

interface Params {
  params: Promise<{ id: string }>;
}

function authorizationFailure(reason: "UNAUTHORIZED" | "FORBIDDEN") {
  if (reason === "UNAUTHORIZED") {
    return toJsonResponse(fail("UNAUTHORIZED", "Debes iniciar sesión."), 401);
  }

  return toJsonResponse(fail("FORBIDDEN", "No tienes permisos para gestionar usuarios."), 403);
}

export async function GET(_request: Request, { params }: Params) {
  try {
    const authorization = await authorize("users:manage");

    if (!authorization.authorized) {
      return authorizationFailure(authorization.reason);
    }

    const { id } = await params;
    const user = await AdminUserService.getById(id);

    if (!user) {
      return toJsonResponse(fail("NOT_FOUND", "No se encontró el usuario."), 404);
    }

    return toJsonResponse(ok(user));
  } catch {
    return toJsonResponse(fail("INTERNAL_ERROR", "No fue posible consultar el usuario."), 500);
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const authorization = await authorize("users:manage");

    if (!authorization.authorized) {
      return authorizationFailure(authorization.reason);
    }

    const body = await request.json();
    const result = updateAdminUserSchema.safeParse(body);

    if (!result.success) {
      return toJsonResponse(
        fail("VALIDATION_ERROR", "Revisa los campos indicados.", result.error.issues),
        400,
      );
    }

    const { id } = await params;
    const user = await AdminUserService.update(id, result.data, authorization.user.id);

    if (!user) {
      return toJsonResponse(fail("NOT_FOUND", "No se encontró el usuario."), 404);
    }

    return toJsonResponse(ok(user));
  } catch (error) {
    if (error instanceof SyntaxError || (error instanceof Error && error.name === "SyntaxError")) {
      return toJsonResponse(
        fail("VALIDATION_ERROR", "El cuerpo de la solicitud no es válido."),
        400,
      );
    }

    if (error instanceof Error && error.message === "SELF_DEACTIVATION_NOT_ALLOWED") {
      return toJsonResponse(
        fail("SELF_DEACTIVATION_NOT_ALLOWED", "No puedes desactivar tu propia cuenta."),
        409,
      );
    }

    if (error instanceof Error && error.message === "LAST_ACTIVE_ADMIN") {
      return toJsonResponse(
        fail("LAST_ACTIVE_ADMIN", "Debe permanecer al menos un administrador activo."),
        409,
      );
    }

    return toJsonResponse(fail("INTERNAL_ERROR", "No fue posible actualizar el usuario."), 500);
  }
}
