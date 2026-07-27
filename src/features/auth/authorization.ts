import type { PublicUser } from "@/types";
import { AuthService } from "@/services/auth.service";
import { hasPermission, type Permission } from "./permissions";

export type AuthorizationResult =
  | {
      authorized: true;
      user: PublicUser;
    }
  | {
      authorized: false;
      reason: "UNAUTHORIZED" | "FORBIDDEN";
    };

export async function authorize(permission: Permission): Promise<AuthorizationResult> {
  const user = await AuthService.currentUser();

  if (!user) {
    return {
      authorized: false,
      reason: "UNAUTHORIZED",
    };
  }

  if (!hasPermission(user.role, permission)) {
    return {
      authorized: false,
      reason: "FORBIDDEN",
    };
  }

  return {
    authorized: true,
    user,
  };
}
