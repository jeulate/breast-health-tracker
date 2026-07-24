"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";
import type { ProfileTheme } from "@/features/profile";
import { profileThemeToNextTheme } from "./profile-form.helpers";

const THEME_STORAGE_KEY = "theme";

export function ThemePreferenceSync({ theme }: { theme: ProfileTheme }) {
  const { setTheme } = useTheme();

  useEffect(() => {
    // Redis solo inicializa el tema cuando este navegador todavía
    // no tiene una selección local.
    const localTheme = window.localStorage.getItem(THEME_STORAGE_KEY);

    if (localTheme === null) {
      setTheme(profileThemeToNextTheme(theme));
    }
  }, [setTheme, theme]);

  return null;
}