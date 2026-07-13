"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ThemeToggle } from "@/components/ui/theme-toggle";

interface HeaderProps {
  userEmail?: string;
  isMobileSidebarOpen: boolean;
  isDesktopSidebarCollapsed: boolean;
  onMenuClick: () => void;
}

export function Header({
  userEmail,
  isMobileSidebarOpen,
  isDesktopSidebarCollapsed,
  onMenuClick,
}: HeaderProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout(): Promise<void> {
    setLoading(true);

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });

      router.push("/login");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <header className="border-border bg-surface/95 z-30 flex h-16 shrink-0 items-center justify-between border-b px-3 backdrop-blur transition-colors sm:px-4 lg:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Alternar menú lateral"
          aria-controls="dashboard-sidebar"
          aria-expanded={isMobileSidebarOpen || !isDesktopSidebarCollapsed}
          className={[
            "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg",
            "border-border text-muted border bg-transparent",
            "transition-all duration-200",
            "hover:bg-surface-secondary hover:text-foreground",
            "focus-visible:ring-2 focus-visible:outline-none",
            "focus-visible:ring-rose-500/30",
          ].join(" ")}
        >
          <span className="sr-only">Alternar menú lateral</span>

          <HamburgerIcon />
        </button>

        <div className="min-w-0">
          <h1 className="text-foreground truncate text-sm font-semibold sm:text-base">
            Panel de administración
          </h1>

          <p className="text-muted hidden truncate text-xs sm:block">
            Seguimiento y gestión de pacientes
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <ThemeToggle />

        {userEmail && (
          <div className="hidden min-w-0 text-right md:block">
            <p className="text-foreground max-w-48 truncate text-sm font-medium xl:max-w-64">
              {userEmail}
            </p>

            <p className="text-muted text-xs">Administrador</p>
          </div>
        )}

        <button
          type="button"
          onClick={handleLogout}
          disabled={loading}
          className="border-border bg-surface-secondary text-foreground hover:bg-border/60 hidden min-h-10 items-center justify-center rounded-lg border px-3 text-sm font-medium transition focus-visible:ring-2 focus-visible:ring-rose-500/30 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 sm:inline-flex"
        >
          {loading ? "Saliendo…" : "Cerrar sesión"}
        </button>
      </div>
    </header>
  );
}

function HamburgerIcon() {
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
      <path d="M4 7h16" />
      <path d="M4 12h10" />
      <path d="M4 17h16" />
    </svg>
  );
}
