import type { UserRole } from "@/types";

export const PERMISSIONS = [
  "dashboard:view",
  "patients:read",
  "patients:manage",
  "calendar:read",
  "calendar:manage",
  "reports:read",
  "reports:export",
  "profile:manage",
  "users:manage",
  "settings:manage",
  "audit:read",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

const SHARED_PERMISSIONS = [
  "dashboard:view",
  "patients:read",
  "patients:manage",
  "calendar:read",
  "calendar:manage",
  "reports:read",
  "reports:export",
  "profile:manage",
] as const satisfies readonly Permission[];

export const ROLE_PERMISSIONS = {
  ADMIN: [
    ...SHARED_PERMISSIONS,
    "users:manage",
    "settings:manage",
    "audit:read",
  ],
  PROFESSIONAL: [...SHARED_PERMISSIONS],
} as const satisfies Record<UserRole, readonly Permission[]>;

export function hasPermission(
  role: UserRole,
  permission: Permission,
): boolean {
  const permissions: readonly Permission[] = ROLE_PERMISSIONS[role];

  return permissions.includes(permission);
}