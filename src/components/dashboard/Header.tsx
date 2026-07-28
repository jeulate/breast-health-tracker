"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import type { UserRole } from "@/types";

const PROFILE_PHOTO_UPDATED_EVENT = "profile-photo-updated";

interface ProfilePhotoUpdatedEventDetail {
  endpoint: string;
  hasPhoto: boolean;
  version: number;
}

interface HeaderProps {
  userName?: string;
  userEmail?: string;
  userRole?: UserRole;
  hasProfilePhoto?: boolean;
  isMobileSidebarOpen: boolean;
  isDesktopSidebarCollapsed: boolean;
  onMenuClick: () => void;
}

function getRoleLabel(role?: UserRole): string {
  return role === "ADMIN" ? "Administrador" : "Profesional";
}

function getInitials(name?: string, email?: string): string {
  const source = name?.trim() || email?.trim() || "Usuario";

  const initials = source
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  return initials || "U";
}

export function Header({
  userName,
  userEmail,
  userRole,
  hasProfilePhoto = false,
  isMobileSidebarOpen,
  isDesktopSidebarCollapsed,
  onMenuClick,
}: Readonly<HeaderProps>) {
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [photoLoadFailed, setPhotoLoadFailed] = useState(false);
  const [currentHasProfilePhoto, setCurrentHasProfilePhoto] = useState(hasProfilePhoto);
  const [photoVersion, setPhotoVersion] = useState(0);

  const displayName = userName?.trim() || userEmail || "Usuario";
  const roleLabel = getRoleLabel(userRole);
  const initials = getInitials(userName, userEmail);
  const showProfilePhoto = currentHasProfilePhoto && !photoLoadFailed;
  const profilePhotoUrl =
    photoVersion > 0 ? `/api/profile/photo?v=${photoVersion}` : "/api/profile/photo";

  useEffect(() => {
    function handleProfilePhotoUpdated(event: Event): void {
      const customEvent = event as CustomEvent<ProfilePhotoUpdatedEventDetail>;

      if (customEvent.detail.endpoint !== "/api/profile/photo") {
        return;
      }

      setCurrentHasProfilePhoto(customEvent.detail.hasPhoto);
      setPhotoLoadFailed(false);
      setPhotoVersion(customEvent.detail.version);
    }

    window.addEventListener(PROFILE_PHOTO_UPDATED_EVENT, handleProfilePhotoUpdated);

    return () => {
      window.removeEventListener(PROFILE_PHOTO_UPDATED_EVENT, handleProfilePhotoUpdated);
    };
  }, []);

  useEffect(() => {
    if (!isUserMenuOpen) return;

    function handlePointerDown(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsUserMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isUserMenuOpen]);

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

        <div ref={menuRef} className="relative">
          <button
            type="button"
            onClick={() => setIsUserMenuOpen((current) => !current)}
            aria-haspopup="menu"
            aria-expanded={isUserMenuOpen}
            aria-controls="dashboard-user-menu"
            className="hover:bg-surface-secondary flex items-center gap-2 rounded-xl p-1.5 transition focus-visible:ring-2 focus-visible:ring-rose-500/30 focus-visible:outline-none sm:gap-3"
          >
            <span className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-rose-500 to-pink-600 text-sm font-semibold text-white shadow-sm">
              {showProfilePhoto ? (
                <Image
                  key={profilePhotoUrl}
                  src={profilePhotoUrl}
                  alt={`Fotografía de ${displayName}`}
                  fill
                  sizes="40px"
                  className="object-cover"
                  unoptimized
                  onError={() => setPhotoLoadFailed(true)}
                />
              ) : (
                <span aria-hidden="true">{initials}</span>
              )}
            </span>

            <span className="hidden min-w-0 text-left md:block">
              <span className="text-foreground block max-w-40 truncate text-sm font-medium xl:max-w-56">
                {displayName}
              </span>

              <span className="text-muted block text-xs">{roleLabel}</span>
            </span>

            <ChevronDownIcon isOpen={isUserMenuOpen} />
          </button>

          {isUserMenuOpen ? (
            <div
              id="dashboard-user-menu"
              role="menu"
              className="border-border bg-surface absolute right-0 z-50 mt-2 w-[min(20rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border shadow-xl"
            >
              <div className="border-border border-b px-4 py-4">
                <p className="text-foreground truncate text-sm font-semibold">{displayName}</p>

                <p className="text-muted mt-0.5 truncate text-xs">{userEmail}</p>

                <span className="mt-3 inline-flex rounded-full bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
                  {roleLabel}
                </span>
              </div>

              <div className="p-2">
                <Link
                  href="/dashboard/profile"
                  role="menuitem"
                  onClick={() => setIsUserMenuOpen(false)}
                  className="text-foreground hover:bg-surface-secondary flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition focus-visible:ring-2 focus-visible:ring-rose-500/30 focus-visible:outline-none"
                >
                  <UserIcon />
                  <span>Mi perfil</span>
                </Link>

                <Link
                  href="/dashboard/profile"
                  role="menuitem"
                  onClick={() => setIsUserMenuOpen(false)}
                  className="text-foreground hover:bg-surface-secondary flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition focus-visible:ring-2 focus-visible:ring-rose-500/30 focus-visible:outline-none"
                >
                  <SettingsIcon />
                  <span>Configuración</span>
                </Link>
              </div>

              <div className="border-border border-t p-2">
                <button
                  type="button"
                  role="menuitem"
                  onClick={handleLogout}
                  disabled={loading}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-red-600 transition hover:bg-red-50 focus-visible:ring-2 focus-visible:ring-red-500/30 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-950/30"
                >
                  <LogoutIcon />
                  <span>{loading ? "Cerrando sesión..." : "Cerrar sesión"}</span>
                </button>
              </div>
            </div>
          ) : null}
        </div>
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

function ChevronDownIcon({ isOpen }: Readonly<{ isOpen: boolean }>) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`text-muted hidden h-4 w-4 transition-transform sm:block ${
        isOpen ? "rotate-180" : ""
      }`}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="text-muted h-5 w-5"
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-muted h-5 w-5"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V21h-4v-.07A1.7 1.7 0 0 0 8.97 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15 1.7 1.7 0 0 0 3.07 14H3v-4h.07A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 8.97 4.6 1.7 1.7 0 0 0 10 3.07V3h4v.07a1.7 1.7 0 0 0 1.03 1.53 1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9 1.7 1.7 0 0 0 20.93 10H21v4h-.07A1.7 1.7 0 0 0 19.4 15Z" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
    >
      <path d="M10 17l5-5-5-5" />
      <path d="M15 12H3" />
      <path d="M15 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4" />
    </svg>
  );
}
