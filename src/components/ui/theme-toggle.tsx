"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import type { ApiResponse } from "@/types";
import type { UserProfile } from "@/features/profile";

function subscribe(): () => void {
  return () => undefined;
}

function getClientSnapshot(): boolean {
  return true;
}

function getServerSnapshot(): boolean {
  return false;
}

export function ThemeToggle() {
  const isMounted = useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
  const { resolvedTheme, setTheme } = useTheme();

  if (!isMounted) {
    return (
      <span
        aria-hidden="true"
        className="border-border bg-surface-secondary h-10 w-10 animate-pulse rounded-lg border"
      />
    );
  }

  const isDark = resolvedTheme === "dark";

  async function handleToggle(): Promise<void> {
  const nextTheme = isDark ? "light" : "dark";

  // Aplicar inmediatamente en el navegador.
  setTheme(nextTheme);

  try {
    const response = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        theme: nextTheme.toUpperCase(),
      }),
    });

    const payload = (await response.json()) as ApiResponse<UserProfile>;

    if (!response.ok || !payload.success) {
      console.error("No se pudo guardar la preferencia de tema:", payload);
    }
  } catch (error) {
    console.error("Error al guardar la preferencia de tema:", error);
  }
}

  return (
    <button
      type="button"
      onClick={() => void handleToggle()}
      aria-label={isDark ? "Activar modo claro" : "Activar modo oscuro"}
      title={isDark ? "Activar modo claro" : "Activar modo oscuro"}
      className={[
        "inline-flex h-10 w-10 items-center justify-center rounded-lg",
        "border-border bg-surface text-muted border shadow-sm",
        "hover:bg-surface-secondary hover:text-foreground transition",
        "focus-visible:ring-2 focus-visible:outline-none",
        "focus-visible:ring-rose-500/30",
      ].join(" ")}
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}

function SunIcon() {
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
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.42 1.42" />
      <path d="m17.65 17.65 1.42 1.42" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m4.93 19.07 1.42-1.42" />
      <path d="m17.65 6.35 1.42-1.42" />
    </svg>
  );
}

function MoonIcon() {
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
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
    </svg>
  );
}
