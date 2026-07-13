import { loginSchema } from "@/lib/validations/auth";
import { AuthService } from "@/services/auth.service";
import { ok, fail, toJsonResponse } from "@/lib/utils/api-response";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = loginSchema.safeParse(body);
    if (!result.success) {
      return toJsonResponse(fail("VALIDATION_ERROR", "Invalid input", result.error.issues), 400);
    }

    const user = await AuthService.login(result.data.email, result.data.password);
    return toJsonResponse(ok(user));
  } catch (err) {
    const message = err instanceof Error ? err.message : "UNKNOWN";
    if (message === "INVALID_CREDENTIALS") {
      return toJsonResponse(fail("INVALID_CREDENTIALS", "Invalid email or password"), 401);
    }
    if (message === "ACCOUNT_INACTIVE") {
      return toJsonResponse(fail("ACCOUNT_INACTIVE", "Account is inactive"), 403);
    }
    if (message === "FORBIDDEN") {
      return toJsonResponse(fail("FORBIDDEN", "Access denied"), 403);
    }
    return toJsonResponse(fail("INTERNAL_ERROR", "An unexpected error occurred"), 500);
  }
}
