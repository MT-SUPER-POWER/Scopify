"use client";

import { SUBTITLE_COLOR_PRESETS } from "@/constants/subtitle-preview";
import { isSubtitleThemeActive, subtitleThemePatch } from "@/lib/settings/subtitleTheme";
import { useAppearanceStore } from "@/store/module/appearance";
import { useSubtitleThemeStore } from "@/store/module/subtitleThemes";
import { useI18n } from "@/store/module/i18n";
import type { SavedSubtitleTheme } from "@/types/subtitle-preview";

export function useSubtitlePalette() {
  const { t } = useI18n();
  const settings = useAppearanceStore((state) => state.lyricsPreview);
  const update = useAppearanceStore((state) => state.updateLyricsPreview);
  const themes = useSubtitleThemeStore((state) => state.themes);
  const activeId = useSubtitleThemeStore((state) => state.activeId);
  const setActiveId = useSubtitleThemeStore((state) => state.setActiveId);
  const builtins = SUBTITLE_COLOR_PRESETS.map((preset) => ({
    id: preset.id,
    name: t(`subtitlePreview.${preset.label}`),
    settings: preset.settings,
  }));
  const all = [...builtins, ...themes];
  const active =
    all.find((theme) => theme.id === activeId && isSubtitleThemeActive(theme, settings)) ??
    all.find((theme) => isSubtitleThemeActive(theme, settings));
  return {
    builtins,
    themes,
    active,
    apply: (theme: SavedSubtitleTheme) => {
      update(subtitleThemePatch(theme));
      setActiveId(theme.id);
    },
  };
}
