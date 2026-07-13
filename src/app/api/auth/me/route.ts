import { AuthService } from "@/services/auth.service";
import { ok, fail, toJsonResponse } from "@/lib/utils/api-response";

export async function GET() {
  const user = await AuthService.currentUser();
  if (!user) {
    return toJsonResponse(fail("UNAUTHENTICATED", "Not authenticated"), 401);
  }
  return toJsonResponse(ok(user));
}
