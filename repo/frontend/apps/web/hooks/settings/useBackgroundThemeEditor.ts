"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import { BACKGROUND_PRESETS, DEFAULT_BACKGROUND } from "@/constants/appearance";
import {
  applyBackgroundTheme,
  resolveBackgroundPalette,
  resolveScheduledTheme,
} from "@/lib/settings/appearance";
import { isThemeNameValid, uniqueThemeName } from "@/lib/settings/themeNames";
import { useAppearanceStore } from "@/store/module/appearance";
import { useTranslation } from "react-i18next";

import type {
  BackgroundTheme,
  BackgroundThemeVariant,
  SavedBackgroundTheme,
} from "@/types/appearance/model";
import type { BackgroundThemeEditorProps } from "@/types/appearance/themeEditor";

export function useBackgroundThemeEditor({ themeId, copyFrom }: BackgroundThemeEditorProps) {
  const { t } = useTranslation();
  const { resolvedTheme } = useTheme();
  const [variant, setVariant] = useState<BackgroundThemeVariant>(
    resolvedTheme === "light" ? "light" : "dark",
  );
  const themes = useAppearanceStore((state) => state.themes);
  const save = useAppearanceStore((state) => state.saveTheme);
  const sourceId = copyFrom ?? themeId;
  const builtin = BACKGROUND_PRESETS.find((theme) => theme.id === sourceId);
  const existing = themes.find((theme) => theme.id === sourceId);
  const readOnly = !!builtin && !copyFrom;
  const missing = !!sourceId && !builtin && !existing;
  const [initial, setInitial] = useState<BackgroundTheme>(() => {
    const { background, dailyThemeIds, schedule } = useAppearanceStore.getState();
    const id = resolveScheduledTheme(background, dailyThemeIds, schedule, new Date());
    const settings =
      background.rotation === "fixed" ? background : applyBackgroundTheme(background, id, themes);
    const dark = resolveBackgroundPalette(settings, themes, "dark");
    const light = resolveBackgroundPalette(settings, themes, "light");
    const source = builtin
      ? {
          ...builtin,
          name: t(`appearance.preset.${builtin.id}`),
          intensity: DEFAULT_BACKGROUND.intensity,
          height: DEFAULT_BACKGROUND.height,
        }
      : existing;
    const fallback = {
      id: `user:${crypto.randomUUID()}` as const,
      name: uniqueThemeName(t("appearance.theme.untitled", { number: themes.length + 1 }), themes),
      light: { top: light.top, bottom: light.bottom },
      dark: { top: dark.top, bottom: dark.bottom },
      intensity: settings.intensity,
      height: settings.height,
    };
    if (!source) return fallback;
    return copyFrom
      ? {
          ...source,
          id: `user:${crypto.randomUUID()}`,
          name: uniqueThemeName(t("themeEditor.copyName", { name: source.name }), themes),
        }
      : { ...source };
  });
  const [draft, setDraft] = useState(initial);
  const saveDraft = (asNew = false) => {
    if (readOnly || missing || !isThemeNameValid(draft, themes) || !draft.id.startsWith("user:"))
      return null;
    const saved: SavedBackgroundTheme = {
      ...draft,
      id: asNew ? `user:${crypto.randomUUID()}` : (draft.id as SavedBackgroundTheme["id"]),
      name: asNew ? uniqueThemeName(draft.name, themes) : draft.name.trim(),
    };
    save(saved);
    setDraft(saved);
    setInitial(saved);
    return saved.id;
  };
  return {
    variant,
    setVariant,
    preview: { ...draft[variant], intensity: draft.intensity, height: draft.height },
    draft,
    readOnly,
    missing,
    setDraft: (next: BackgroundTheme) => {
      if (!readOnly) setDraft(next);
    },
    isNew: !themes.some((theme) => theme.id === draft.id),
    dirty: JSON.stringify(draft) !== JSON.stringify(initial),
    valid: !missing && isThemeNameValid(draft, themes),
    reset: () => setDraft(initial),
    save: () => saveDraft(),
    duplicate: () => saveDraft(true),
  };
}
