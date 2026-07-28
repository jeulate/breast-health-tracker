import { authorize } from "@/features/auth";
import { fail, ok, toJsonResponse } from "@/lib/utils/api-response";
import { updateAdminSettingsSchema } from "@/lib/validations/admin-settings";
import { adminSettingsService } from "@/services/admin-settings.service";

function authorizationFailureResponse(reason: "UNAUTHORIZED" | "FORBIDDEN"): Response {
  if (reason === "UNAUTHORIZED") {
    return toJsonResponse(
      fail("UNAUTHORIZED", "Debes iniciar sesión para realizar esta acción."),
      401,
    );
  }

  return toJsonResponse(
    fail("FORBIDDEN", "No tienes permisos para administrar la configuración."),
    403,
  );
}

export async function GET(): Promise<Response> {
  const authorization = await authorize("settings:manage");

  if (!authorization.authorized) {
    return authorizationFailureResponse(authorization.reason);
  }

  try {
    const settings = await adminSettingsService.getSettings();

    return toJsonResponse(ok(settings));
  } catch (error) {
    console.error("Error al obtener la configuración administrativa:", error);

    return toJsonResponse(
      fail(
        "ADMIN_SETTINGS_FETCH_FAILED",
        "No fue posible obtener la configuración de la aplicación.",
      ),
      500,
    );
  }
}

export async function PUT(request: Request): Promise<Response> {
  const authorization = await authorize("settings:manage");

  if (!authorization.authorized) {
    return authorizationFailureResponse(authorization.reason);
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return toJsonResponse(
      fail("INVALID_JSON", "El cuerpo de la solicitud no contiene un JSON válido."),
      400,
    );
  }

  const validationResult = updateAdminSettingsSchema.safeParse(body);

  if (!validationResult.success) {
    return toJsonResponse(
      fail(
        "VALIDATION_ERROR",
        "La configuración proporcionada no es válida.",
        validationResult.error.flatten(),
      ),
      400,
    );
  }

  try {
    const settings = await adminSettingsService.updateSettings(
      validationResult.data,
      authorization.user.id,
    );

    return toJsonResponse(ok(settings));
  } catch (error) {
    console.error("Error al actualizar la configuración administrativa:", error);

    return toJsonResponse(
      fail(
        "ADMIN_SETTINGS_UPDATE_FAILED",
        "No fue posible actualizar la configuración de la aplicación.",
      ),
      500,
    );
  }
}
