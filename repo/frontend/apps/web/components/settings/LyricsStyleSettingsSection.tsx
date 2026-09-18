"use client";

import { useAppearanceStore } from "@/store/module/appearance";
import { useI18n } from "@/store/module/i18n";
import { SubtitleThemeLibrary } from "./SubtitleThemeLibrary";
import { SubtitleStyleEditor } from "./SubtitleStyleEditor";
import { SettingSection } from "./SettingsUI";

export function LyricsStyleSettingsSection() {
  const { t } = useI18n();
  const settings = useAppearanceStore((state) => state.lyricsPreview);
  const update = useAppearanceStore((state) => state.updateLyricsPreview);
  return (
    <div className="space-y-8">
      <SubtitleThemeLibrary />
      <SettingSection title={t("themeEditor.styleLabel")}>
        <p className="mb-5 text-sm text-muted-foreground">{t("subtitlePalette.liveHint")}</p>
        <SubtitleStyleEditor settings={settings} onChange={update} />
      </SettingSection>
    </div>
  );
}
