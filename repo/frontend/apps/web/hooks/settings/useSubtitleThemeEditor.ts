"use client";

import { useState } from "react";
import { DEFAULT_LYRICS_PREVIEW } from "@/constants/appearance";
import { subtitlePalette } from "@/lib/settings/subtitlePalette";
import { subtitleThemePatch } from "@/lib/settings/subtitleTheme";
import { isThemeNameValid, uniqueThemeName } from "@/lib/settings/themeNames";
import { updateSubtitleSettings } from "@/lib/settings/updateSubtitleSettings";
import { useAppearanceStore } from "@/store/module/appearance";
import { useSubtitleThemeStore } from "@/store/module/subtitleThemes";
import { useI18n } from "@/store/module/i18n";
import type { LyricsPreviewSettings } from "@/types/appearance";
import type { SavedSubtitleTheme, SubtitleThemeEditorProps } from "@/types/subtitle-preview";

export function useSubtitleThemeEditor({ themeId, kind, useCurrent }: SubtitleThemeEditorProps) {
  const { t } = useI18n();
  const themes = useSubtitleThemeStore((state) => state.themes);
  const save = useSubtitleThemeStore((state) => state.save);
  const apply = useAppearanceStore((state) => state.updateLyricsPreview);
  const [initial] = useState<SavedSubtitleTheme>(() => {
    const theme = themes.find((item) => item.id === themeId && (item.kind ?? "style") === kind);
    const current = useAppearanceStore.getState().lyricsPreview;
    return {
      id: theme?.id ?? crypto.randomUUID(),
      kind,
      name:
        theme?.name ??
        uniqueThemeName(t("appearance.theme.untitled", { number: themes.length + 1 }), themes),
      settings:
        theme && !useCurrent
          ? updateSubtitleSettings(current, subtitleThemePatch(theme))
          : { ...current },
    };
  });
  const [draft, setDraft] = useState(initial);
  const update = (patch: Partial<LyricsPreviewSettings>) =>
    setDraft((previous) => ({
      ...previous,
      settings: updateSubtitleSettings(previous.settings, patch),
    }));
  const saveDraft = (theme: SavedSubtitleTheme) => {
    save(theme);
    apply(subtitleThemePatch(theme));
  };
  return {
    draft,
    isNew: !themes.some((theme) => theme.id === draft.id),
    dirty: JSON.stringify(draft) !== JSON.stringify(initial),
    valid: isThemeNameValid(draft, themes),
    setName: (name: string) => setDraft((previous) => ({ ...previous, name })),
    update,
    reset: () => setDraft(initial),
    resetDefaults: () =>
      update(kind === "palette" ? subtitlePalette(DEFAULT_LYRICS_PREVIEW) : DEFAULT_LYRICS_PREVIEW),
    save: () => saveDraft(draft),
    duplicate: () =>
      saveDraft({ ...draft, id: crypto.randomUUID(), name: uniqueThemeName(draft.name, themes) }),
  };
}
