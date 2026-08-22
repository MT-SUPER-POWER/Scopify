"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { SHADCN_THEME_TOKENS, THEME_SOURCE_IDS } from "@/constants/theme-lab";
import { ThemePrototypeContext } from "@/lib/theme-prototype-context";
import { normalizeThemeId, readThemeProfile } from "@/lib/theme-lab";
import type { ThemeDraft, ThemeMode, ThemePrototypeRecord } from "@/types/theme-lab";

export function ThemePrototypeProvider({ children }: { children: ReactNode }) {
  const [activeThemeId, setActiveThemeId] = useState<string>(THEME_SOURCE_IDS.shadcn);
  const [mode, setMode] = useState<ThemeMode>("light");
  const [themes, setThemes] = useState<ThemePrototypeRecord[]>([]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const draft = readThemeProfile(THEME_SOURCE_IDS.shadcn, SHADCN_THEME_TOKENS);
      setThemes([{ draft, id: THEME_SOURCE_IDS.shadcn, name: "Shadcn Default" }]);
    });

    return () => cancelAnimationFrame(frame);
  }, []);

  const saveTheme = useCallback((requestedId: string, draft: ThemeDraft) => {
    const id = normalizeThemeId(requestedId);
    const record = { draft, id, name: id };

    setThemes((current) => {
      const exists = current.some((theme) => theme.id === id);
      return exists
        ? current.map((theme) => (theme.id === id ? record : theme))
        : [...current, record];
    });

    return id;
  }, []);

  const value = useMemo(
    () => ({
      activeTheme: themes.find((theme) => theme.id === activeThemeId),
      activeThemeId,
      applyTheme: setActiveThemeId,
      mode,
      saveTheme,
      setMode,
      themes,
    }),
    [activeThemeId, mode, saveTheme, themes],
  );

  return <ThemePrototypeContext.Provider value={value}>{children}</ThemePrototypeContext.Provider>;
}
