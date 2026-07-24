import { getSession } from "@/lib/auth/session";
import { fail, ok, toJsonResponse } from "@/lib/utils/api-response";
import { updateUserProfileSchema } from "@/lib/validations/profile";
import { UserProfileService } from "@/services/user-profile.service";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return toJsonResponse(fail("UNAUTHENTICATED", "Not authenticated"), 401);
  }

  const profile = await UserProfileService.get(session.sub);
  if (!profile) {
    return toJsonResponse(fail("NOT_FOUND", "User profile not found"), 404);
  }

  return toJsonResponse(ok(profile));
}

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session) {
    return toJsonResponse(fail("UNAUTHENTICATED", "Not authenticated"), 401);
  }

  try {
    const body: unknown = await request.json();
    const result = updateUserProfileSchema.safeParse(body);
    if (!result.success) {
      return toJsonResponse(
        fail("VALIDATION_ERROR", "Invalid input", result.error.issues),
        400,
      );
    }

    const profile = await UserProfileService.update(session.sub, result.data);
    if (!profile) {
      return toJsonResponse(fail("NOT_FOUND", "User profile not found"), 404);
    }

    return toJsonResponse(ok(profile));
  } catch {
    return toJsonResponse(fail("INTERNAL_ERROR", "An unexpected error occurred"), 500);
  }
}
