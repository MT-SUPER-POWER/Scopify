"use client";

import { SubtitleThemeLibrary } from "./SubtitleThemeLibrary";

export function LyricsStyleSettingsSection() {
  return (
    <div className="space-y-8">
      <SubtitleThemeLibrary />
      <SubtitleThemeLibrary paletteOnly />
    </div>
  );
}
