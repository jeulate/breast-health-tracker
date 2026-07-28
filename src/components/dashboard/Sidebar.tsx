"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { hasPermission, type Permission } from "@/features/auth/permissions";
import type { UserRole } from "@/types";

interface SidebarProps {
  appName?: string;
  userRole?: UserRole;
  isMobileOpen: boolean;
  isDesktopCollapsed: boolean;
  onMobileClose: () => void;
}

interface NavItem {
  href: string;
  label: string;
  icon: string;
  permission?: Permission;
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Inicio", icon: "⊞" },
  { href: "/dashboard/patients", label: "Pacientes", icon: "♡" },
  { href: "/dashboard/calendar", label: "Calendario", icon: "◦" },
  { href: "/dashboard/reports", label: "Reportes", icon: "▤" },
  { href: "/dashboard/profile", label: "Mi perfil", icon: "○" },
  {
    href: "/dashboard/admin",
    label: "Administración",
    icon: "⚙",
    permission: "settings:manage",
  },
  {
    href: "/dashboard/admin/settings",
    label: "Configuración",
    icon: "◉",
    permission: "settings:manage",
  },
];

export function getSidebarNavItems(userRole?: UserRole): NavItem[] {
  return navItems.filter(
    ({ permission }) =>
      !permission || (userRole !== undefined && hasPermission(userRole, permission)),
  );
}

export function isSidebarNavItemActive(pathname: string, href: string): boolean {
  const isAdminChildRoute =
    href === "/dashboard/admin" &&
    pathname.startsWith("/dashboard/admin/") &&
    !pathname.startsWith("/dashboard/admin/settings");

  const isNestedRoute =
    href !== "/dashboard" && href !== "/dashboard/admin" && pathname.startsWith(`${href}/`);

  return pathname === href || isAdminChildRoute || isNestedRoute;
}

export function getAppInitials(appName: string): string {
  const words = appName.trim().split(/\s+/).filter(Boolean);

  if (words.length === 0) {
    return "BT";
  }

  return words
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join("")
    .toLocaleUpperCase("es-BO");
}

export function Sidebar({
  appName = "BI-RADS Tracker",
  userRole,
  isMobileOpen,
  isDesktopCollapsed,
  onMobileClose,
}: SidebarProps) {
  const pathname = usePathname();
  const normalizedAppName = appName.trim() || "BI-RADS Tracker";
  const appInitials = getAppInitials(normalizedAppName);

  useEffect(() => {
    onMobileClose();
  }, [pathname, onMobileClose]);

  return (
    <aside
      id="dashboard-sidebar"
      aria-label="Menú lateral"
      aria-hidden={!isMobileOpen && isDesktopCollapsed}
      className={[
        "fixed inset-y-0 left-0 z-50 flex h-dvh w-64 shrink-0 flex-col overflow-hidden",
        "border-border bg-surface border-r shadow-xl",
        "transition-[transform,margin] duration-300 ease-in-out",
        "lg:relative lg:z-20 lg:shadow-none",
        isMobileOpen ? "translate-x-0" : "-translate-x-full",
        isDesktopCollapsed ? "lg:-ml-64 lg:-translate-x-full" : "lg:ml-0 lg:translate-x-0",
      ].join(" ")}
    >
      <div className="border-border flex h-16 shrink-0 items-center justify-between border-b px-4 sm:px-5">
        <Link href="/dashboard" className="group flex min-w-0 items-center gap-3">
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-600 text-sm font-bold text-white shadow-sm shadow-rose-500/20">
            {appInitials}
          </span>
          <div className="min-w-0">
            <p className="text-foreground truncate text-base font-bold">{normalizedAppName}</p>
            <p className="text-muted truncate text-xs">Health Dashboard</p>
          </div>
        </Link>
        <button
          type="button"
          onClick={onMobileClose}
          aria-label="Cerrar menú"
          className="text-muted hover:border-border hover:bg-surface-secondary hover:text-foreground inline-flex h-9 w-9 items-center justify-center rounded-lg border border-transparent transition focus-visible:ring-2 focus-visible:ring-rose-500/30 focus-visible:outline-none lg:hidden"
        >
          <CloseIcon />
        </button>
      </div>

      <nav aria-label="Navegación principal" className="min-h-0 flex-1 overflow-y-auto px-3 py-5">
        <p className="text-muted mb-2 px-3 text-[11px] font-semibold tracking-wider uppercase">
          Menú
        </p>
        <div className="flex flex-col gap-1">
          {getSidebarNavItems(userRole).map(({ href, label, icon }) => {
            const isActive = isSidebarNavItemActive(pathname, href);

            return (
              <Link
                key={href}
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={[
                  "group flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5",
                  "text-sm font-medium transition",
                  isActive
                    ? "bg-rose-50 text-rose-700 shadow-sm dark:bg-rose-500/10 dark:text-rose-300"
                    : "text-muted hover:bg-surface-secondary hover:text-foreground",
                ].join(" ")}
              >
                <span
                  aria-hidden="true"
                  className={[
                    "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                    "text-base transition",
                    isActive
                      ? "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300"
                      : "bg-surface-secondary text-muted group-hover:text-foreground",
                  ].join(" ")}
                >
                  {icon}
                </span>
                <span className="truncate">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <footer className="border-border bg-surface mt-auto shrink-0 border-t p-4">
        <div className="bg-surface-secondary rounded-xl px-3 py-3">
          <p className="text-foreground truncate text-xs font-medium">{normalizedAppName}</p>
          <p className="text-muted mt-0.5 text-xs">v0.1.0 · Fase 9</p>
        </div>
      </footer>
    </aside>
  );
}

function CloseIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      className="h-5 w-5"
    >
      <path d="M6 6l12 12" />
      <path d="M18 6 6 18" />
    </svg>
  );
}
