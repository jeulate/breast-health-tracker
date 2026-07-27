import { authorize } from "@/features/auth";
import { createAdminUserSchema } from "@/lib/validations/admin-user";
import { ok, fail, toJsonResponse } from "@/lib/utils/api-response";
import { AdminUserService } from "@/services/admin-user.service";

function authorizationFailure(reason: "UNAUTHORIZED" | "FORBIDDEN") {
  if (reason === "UNAUTHORIZED") {
    return toJsonResponse(fail("UNAUTHORIZED", "Debes iniciar sesión."), 401);
  }

  return toJsonResponse(fail("FORBIDDEN", "No tienes permisos para gestionar usuarios."), 403);
}

export async function GET() {
  try {
    const authorization = await authorize("users:manage");

    if (!authorization.authorized) {
      return authorizationFailure(authorization.reason);
    }

    const users = await AdminUserService.list();

    return toJsonResponse(ok(users));
  } catch {
    return toJsonResponse(fail("INTERNAL_ERROR", "No fue posible consultar los usuarios."), 500);
  }
}

export async function POST(request: Request) {
  try {
    const authorization = await authorize("users:manage");

    if (!authorization.authorized) {
      return authorizationFailure(authorization.reason);
    }

    const body = await request.json();
    const result = createAdminUserSchema.safeParse(body);

    if (!result.success) {
      return toJsonResponse(
        fail("VALIDATION_ERROR", "Revisa los campos indicados.", result.error.issues),
        400,
      );
    }

    const user = await AdminUserService.create(result.data);

    return toJsonResponse(ok(user), 201);
  } catch (error) {
    if (error instanceof SyntaxError || (error instanceof Error && error.name === "SyntaxError")) {
      return toJsonResponse(
        fail("VALIDATION_ERROR", "El cuerpo de la solicitud no es válido."),
        400,
      );
    }

    if (error instanceof Error && error.message === "EMAIL_ALREADY_EXISTS") {
      return toJsonResponse(
        fail("EMAIL_ALREADY_EXISTS", "El correo electrónico ya está registrado."),
        409,
      );
    }

    return toJsonResponse(fail("INTERNAL_ERROR", "No fue posible crear el usuario."), 500);
  }
}
