import { DEFAULT_LYRICS_PREVIEW } from "@/constants/appearance";
import { SUBTITLE_THEME_EDITOR_PATH } from "@/constants/appearanceRoutes";
import type { LyricsPreviewSettings } from "@/types/appearance";
import type { SavedSubtitleTheme, SubtitleThemeKind } from "@/types/subtitle-preview";
import { updateSubtitleSettings } from "./updateSubtitleSettings";
import { subtitlePalette } from "./subtitlePalette";

export function subtitleThemePatch(theme: SavedSubtitleTheme): Partial<LyricsPreviewSettings> {
  const settings = updateSubtitleSettings(DEFAULT_LYRICS_PREVIEW, theme.settings);
  return theme.kind === "palette" ? subtitlePalette(settings) : settings;
}

export function isSubtitleThemeActive(theme: SavedSubtitleTheme, settings: LyricsPreviewSettings) {
  const patch = subtitleThemePatch(theme);
  return (Object.keys(patch) as (keyof LyricsPreviewSettings)[]).every(
    (key) => patch[key] === settings[key],
  );
}

export function subtitleThemeEditorHref(kind: SubtitleThemeKind, id?: string, useCurrent = false) {
  const params = new URLSearchParams({ kind });
  if (id) params.set("id", id);
  if (useCurrent) params.set("source", "current");
  return `${SUBTITLE_THEME_EDITOR_PATH}?${params}`;
}
