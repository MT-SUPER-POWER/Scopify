import { SUBTITLE_THEME_EDITOR_PATH } from "@/constants/appearanceRoutes";
import type { LyricsPreviewSettings } from "@/types/appearance";
import type { SavedSubtitleTheme, SubtitlePalette } from "@/types/subtitle-preview";
import { subtitlePalette } from "./subtitlePalette";

export function subtitleThemePatch(theme: SavedSubtitleTheme): SubtitlePalette {
  return subtitlePalette(theme.settings);
}

export function isSubtitleThemeActive(
  theme: SavedSubtitleTheme,
  settings: LyricsPreviewSettings | SubtitlePalette,
) {
  const patch = subtitleThemePatch(theme);
  return (Object.keys(patch) as (keyof SubtitlePalette)[]).every(
    (key) => patch[key].toString().toLowerCase() === settings[key].toString().toLowerCase(),
  );
}

export function subtitleThemeEditorHref(id?: string, useCurrent = false, copyFrom?: string) {
  const params = new URLSearchParams();
  if (id) params.set("id", id);
  if (useCurrent) params.set("source", "current");
  if (copyFrom) params.set("copy", copyFrom);
  return `${SUBTITLE_THEME_EDITOR_PATH}?${params}`;
}
