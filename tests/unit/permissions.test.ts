import { describe, expect, it } from "vitest";
import { PERMISSIONS, ROLE_PERMISSIONS, hasPermission, type Permission } from "@/features/auth";

describe("role permissions", () => {
  it("grants shared permissions to administrators and professionals", () => {
    const sharedPermissions: Permission[] = [
      "dashboard:view",
      "patients:read",
      "patients:manage",
      "calendar:read",
      "calendar:manage",
      "reports:read",
      "reports:export",
      "profile:manage",
    ];

    for (const permission of sharedPermissions) {
      expect(hasPermission("ADMIN", permission)).toBe(true);
      expect(hasPermission("PROFESSIONAL", permission)).toBe(true);
    }
  });

  it("grants administrative permissions only to administrators", () => {
    const administrativePermissions: Permission[] = [
      "users:manage",
      "settings:manage",
      "audit:read",
    ];

    for (const permission of administrativePermissions) {
      expect(hasPermission("ADMIN", permission)).toBe(true);
      expect(hasPermission("PROFESSIONAL", permission)).toBe(false);
    }
  });

  it("assigns every declared permission to administrators", () => {
    expect(ROLE_PERMISSIONS.ADMIN).toHaveLength(PERMISSIONS.length);

    for (const permission of PERMISSIONS) {
      expect(hasPermission("ADMIN", permission)).toBe(true);
    }
  });

  it("does not contain duplicated permissions in either role", () => {
    expect(new Set(ROLE_PERMISSIONS.ADMIN).size).toBe(ROLE_PERMISSIONS.ADMIN.length);

    expect(new Set(ROLE_PERMISSIONS.PROFESSIONAL).size).toBe(ROLE_PERMISSIONS.PROFESSIONAL.length);
  });
});
