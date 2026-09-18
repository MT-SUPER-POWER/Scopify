"use client";

import { useState } from "react";
import {
  applyBackgroundTheme,
  resolveBackgroundPalette,
  resolveScheduledTheme,
} from "@/lib/settings/appearance";
import { isThemeNameValid, uniqueThemeName } from "@/lib/settings/themeNames";
import { useAppearanceStore } from "@/store/module/appearance";
import { useI18n } from "@/store/module/i18n";
import type { SavedBackgroundTheme } from "@/types/appearance";

export function useBackgroundThemeEditor(themeId: string | null) {
  const { t } = useI18n();
  const themes = useAppearanceStore((state) => state.themes);
  const save = useAppearanceStore((state) => state.saveTheme);
  const [initial] = useState<SavedBackgroundTheme>(() => {
    const existing = themes.find((theme) => theme.id === themeId);
    if (existing) return { ...existing };
    const { background, dailyThemeIds, schedule } = useAppearanceStore.getState();
    const id = resolveScheduledTheme(background, dailyThemeIds, schedule, new Date());
    const settings =
      background.rotation === "fixed" ? background : applyBackgroundTheme(background, id, themes);
    const palette = resolveBackgroundPalette(settings, themes);
    return {
      id: `user:${crypto.randomUUID()}`,
      name: uniqueThemeName(t("appearance.theme.untitled", { number: themes.length + 1 }), themes),
      top: palette.top,
      bottom: palette.bottom,
      intensity: settings.intensity,
      height: settings.height,
    };
  });
  const [draft, setDraft] = useState(initial);
  return {
    draft,
    setDraft,
    isNew: !themes.some((theme) => theme.id === initial.id),
    dirty: JSON.stringify(draft) !== JSON.stringify(initial),
    valid: isThemeNameValid(draft, themes),
    reset: () => setDraft(initial),
    save: () => save(draft),
    duplicate: () =>
      save({
        ...draft,
        id: `user:${crypto.randomUUID()}`,
        name: uniqueThemeName(draft.name, themes),
      }),
  };
}
