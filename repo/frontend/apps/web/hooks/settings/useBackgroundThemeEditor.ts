"use client";

import { useState } from "react";
import { BACKGROUND_PRESETS, DEFAULT_BACKGROUND } from "@/constants/appearance";
import {
  applyBackgroundTheme,
  resolveBackgroundPalette,
  resolveScheduledTheme,
} from "@/lib/settings/appearance";
import { isThemeNameValid, uniqueThemeName } from "@/lib/settings/themeNames";
import { useAppearanceStore } from "@/store/module/appearance";
import { useI18n } from "@/store/module/i18n";
import type { BackgroundTheme, SavedBackgroundTheme } from "@/types/appearance";
import type { BackgroundThemeEditorProps } from "@/types/appearance-theme-editor";

export function useBackgroundThemeEditor({ themeId, copyFrom }: BackgroundThemeEditorProps) {
  const { t } = useI18n();
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
    const palette = resolveBackgroundPalette(settings, themes);
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
      top: palette.top,
      bottom: palette.bottom,
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
