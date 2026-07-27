import { describe, expect, it } from "vitest";
import { getSidebarNavItems } from "@/components/dashboard/Sidebar";

describe("getSidebarNavItems", () => {
  it("hides administration when the user role is unavailable", () => {
    const items = getSidebarNavItems();

    expect(items.some(({ href }) => href === "/dashboard/admin")).toBe(false);
  });

  it("hides administration from professional users", () => {
    const items = getSidebarNavItems("PROFESSIONAL");

    expect(items.some(({ href }) => href === "/dashboard/admin")).toBe(false);
  });

  it("shows administration to administrators", () => {
    const items = getSidebarNavItems("ADMIN");

    expect(items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          href: "/dashboard/admin",
          label: "Administración",
          permission: "settings:manage",
        }),
      ]),
    );
  });

  it("keeps the common navigation available for every role", () => {
    const adminItems = getSidebarNavItems("ADMIN");
    const professionalItems = getSidebarNavItems("PROFESSIONAL");

    const commonRoutes = [
      "/dashboard",
      "/dashboard/patients",
      "/dashboard/calendar",
      "/dashboard/reports",
      "/dashboard/profile",
    ];

    for (const href of commonRoutes) {
      expect(adminItems.some((item) => item.href === href)).toBe(true);
      expect(professionalItems.some((item) => item.href === href)).toBe(true);
    }
  });
});
