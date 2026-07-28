import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Permission } from "@/features/auth/permissions";
import type { UserRole } from "@/types";

const { hasPermissionMock } = vi.hoisted(() => ({
  hasPermissionMock: vi.fn<(role: UserRole, permission: Permission) => boolean>(),
}));

vi.mock("@/features/auth/permissions", () => ({
  hasPermission: hasPermissionMock,
}));

import {
  getAppInitials,
  getSidebarNavItems,
  isSidebarNavItemActive,
} from "@/components/dashboard/Sidebar";

describe("getSidebarNavItems", () => {
  beforeEach(() => {
    hasPermissionMock.mockReset();
  });

  it("oculta las opciones administrativas cuando no existe un rol", () => {
    const items = getSidebarNavItems();

    expect(items.map(({ label }) => label)).not.toContain("Administración");
    expect(items.map(({ label }) => label)).not.toContain("Configuración");
  });

  it("muestra Administración y Configuración cuando el rol tiene settings:manage", () => {
    hasPermissionMock.mockReturnValue(true);

    const items = getSidebarNavItems("ADMIN" as UserRole);
    const labels = items.map(({ label }) => label);

    expect(hasPermissionMock).toHaveBeenCalledWith("ADMIN", "settings:manage");
    expect(labels).toContain("Administración");
    expect(labels).toContain("Configuración");
  });

  it("oculta Administración y Configuración cuando falta settings:manage", () => {
    hasPermissionMock.mockReturnValue(false);

    const items = getSidebarNavItems("PROFESSIONAL" as UserRole);
    const labels = items.map(({ label }) => label);

    expect(labels).not.toContain("Administración");
    expect(labels).not.toContain("Configuración");
  });
});

describe("isSidebarNavItemActive", () => {
  it("activa Inicio únicamente en la ruta principal del dashboard", () => {
    expect(isSidebarNavItemActive("/dashboard", "/dashboard")).toBe(true);

    expect(isSidebarNavItemActive("/dashboard/patients", "/dashboard")).toBe(false);
  });

  it("activa las rutas anidadas de Pacientes", () => {
    expect(isSidebarNavItemActive("/dashboard/patients/patient-1", "/dashboard/patients")).toBe(
      true,
    );
  });

  it("activa Administración en su página principal y subrutas generales", () => {
    expect(isSidebarNavItemActive("/dashboard/admin", "/dashboard/admin")).toBe(true);

    expect(isSidebarNavItemActive("/dashboard/admin/users", "/dashboard/admin")).toBe(true);
  });

  it("no activa Administración dentro de Configuración", () => {
    expect(isSidebarNavItemActive("/dashboard/admin/settings", "/dashboard/admin")).toBe(false);

    expect(isSidebarNavItemActive("/dashboard/admin/settings/security", "/dashboard/admin")).toBe(
      false,
    );
  });

  it("activa Configuración y sus subrutas", () => {
    expect(isSidebarNavItemActive("/dashboard/admin/settings", "/dashboard/admin/settings")).toBe(
      true,
    );

    expect(
      isSidebarNavItemActive("/dashboard/admin/settings/security", "/dashboard/admin/settings"),
    ).toBe(true);
  });
});

describe("getAppInitials", () => {
  it("genera las iniciales de las dos primeras palabras", () => {
    expect(getAppInitials("BI-RADS Tracker")).toBe("BT");
    expect(getAppInitials("Seguimiento BI-RADS")).toBe("SB");
  });

  it("normaliza espacios adicionales", () => {
    expect(getAppInitials("  Salud   Mamaria Bolivia  ")).toBe("SM");
  });

  it("utiliza una inicial cuando existe una sola palabra", () => {
    expect(getAppInitials("Mastología")).toBe("M");
  });

  it("devuelve las iniciales de respaldo cuando el nombre está vacío", () => {
    expect(getAppInitials("   ")).toBe("BT");
  });
});
