import { AuthService } from "@/services/auth.service";
import { ok, toJsonResponse } from "@/lib/utils/api-response";

export async function POST() {
  await AuthService.logout();
  return toJsonResponse(ok({ loggedOut: true }));
}
