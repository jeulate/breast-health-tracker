import { authorize } from "@/features/auth";
import { fail, ok, toJsonResponse } from "@/lib/utils/api-response";

export async function GET(): Promise<Response> {
  const authorization = await authorize("settings:manage");

  if (!authorization.authorized) {
    if (authorization.reason === "UNAUTHORIZED") {
      return toJsonResponse(fail("UNAUTHORIZED", "Debes iniciar sesión."), 401);
    }

    return toJsonResponse(
      fail("FORBIDDEN", "No tienes permisos para acceder a la administración."),
      403,
    );
  }

  return toJsonResponse(
    ok({
      access: true,
      section: "administration",
    }),
  );
}
