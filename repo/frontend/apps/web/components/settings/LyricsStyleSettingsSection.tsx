"use client";

import { Button } from "@scopify/ui/shadcn/components/button";
import { useAppearanceStore } from "@/store/module/appearance";
import { useI18n } from "@/store/module/i18n";
import { SettingRow } from "./SettingsUI";
import { SubtitleLayoutSettings } from "./SubtitleLayoutSettings";
import { SubtitleColorSettings } from "./SubtitleColorSettings";
import { SubtitleFillSettings } from "./SubtitleFillSettings";
import { SubtitleThemeLibrary } from "./SubtitleThemeLibrary";
import { SubtitleMotionSettings } from "./SubtitleMotionSettings";

export function LyricsStyleSettingsSection() {
  const { t } = useI18n();
  const reset = useAppearanceStore((state) => state.resetLyricsPreview);
  const settings = useAppearanceStore((state) => state.lyricsPreview);
  const onChange = useAppearanceStore((state) => state.updateLyricsPreview);
  return (
    <div className="space-y-8">
      <SubtitleLayoutSettings settings={settings} onChange={onChange} />
      <SubtitleThemeLibrary />
      <SubtitleColorSettings />
      <SubtitleFillSettings settings={settings} onChange={onChange} />
      <SubtitleMotionSettings settings={settings} onChange={onChange} />
      <SettingRow
        label={t("appearance.reset.lyrics")}
        control={
          <Button variant="outline" onClick={reset}>
            {t("appearance.reset")}
          </Button>
        }
      />
      <p className="text-xs text-muted-foreground">{t("subtitlePreview.saved")}</p>
    </div>
  );
}
