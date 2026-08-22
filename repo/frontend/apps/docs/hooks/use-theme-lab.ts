"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { SCOPIFY_THEME_TOKENS, SHADCN_THEME_TOKENS, THEME_SOURCE_IDS } from "@/constants/theme-lab";
import { createPreviewStyle, generateThemeArtifacts, readThemeProfile } from "@/lib/theme-lab";
import type {
  ThemeDraft,
  ThemeLabScope,
  ThemeMode,
  ThemeTokenDefinition,
  ThemeTokenLayer,
} from "@/types/theme-lab";

const EMPTY_DRAFT: ThemeDraft = { dark: {}, light: {} };

export function useThemeLab(scope: ThemeLabScope) {
  const definitions = useMemo(
    () =>
      scope === "scopify"
        ? [...SHADCN_THEME_TOKENS, ...SCOPIFY_THEME_TOKENS]
        : [...SHADCN_THEME_TOKENS],
    [scope],
  );
  const sourceThemeId = THEME_SOURCE_IDS[scope];
  const [draft, setDraft] = useState<ThemeDraft>(EMPTY_DRAFT);
  const [error, setError] = useState<string>();
  const [layer, setLayer] = useState<ThemeTokenLayer>("shadcn");
  const [mode, setMode] = useState<ThemeMode>(() =>
    typeof document !== "undefined" && document.documentElement.classList.contains("dark")
      ? "dark"
      : "light",
  );
  const [themeId, setThemeId] = useState(`custom-${scope}`);

  const reset = useCallback(() => {
    try {
      setDraft(readThemeProfile(sourceThemeId, definitions));
      setError(undefined);
    } catch {
      setError("无法读取当前主题变量，请刷新页面后重试。");
    }
  }, [definitions, sourceThemeId]);

  useEffect(() => {
    const frame = requestAnimationFrame(reset);
    return () => cancelAnimationFrame(frame);
  }, [reset]);

  const updateToken = useCallback(
    (definition: ThemeTokenDefinition, value: string) => {
      setDraft((current) => ({
        dark: {
          ...current.dark,
          ...(definition.shared || mode === "dark" ? { [definition.name]: value } : {}),
        },
        light: {
          ...current.light,
          ...(definition.shared || mode === "light" ? { [definition.name]: value } : {}),
        },
      }));
    },
    [mode],
  );

  return {
    artifacts: generateThemeArtifacts(scope, draft, themeId),
    definitions,
    draft,
    error,
    layer,
    mode,
    previewStyle: createPreviewStyle(draft[mode], mode),
    reset,
    setLayer,
    setMode,
    setThemeId,
    sourceThemeId,
    themeId,
    updateToken,
  };
}
