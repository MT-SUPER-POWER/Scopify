"use client";

import { SubtitleThemeLibrary } from "./SubtitleThemeLibrary";
import { Button } from "@scopify/ui/shadcn/components/button";
import { Switch } from "@scopify/ui/shadcn/components/switch";
import { SUBTITLE_COLOR_PRESETS } from "@/constants/subtitle-preview";
import { useAppearanceStore } from "@/store/module/appearance";
import { useI18n } from "@/store/module/i18n";
import { AppearanceRange } from "./AppearanceRange";
import { SettingRow, SettingSection } from "./SettingsUI";
import { SubtitlePaletteFields } from "./SubtitlePaletteFields";

export function SubtitleColorSettings() {
  const { t } = useI18n();
  const settings = useAppearanceStore((state) => state.lyricsPreview);
  const update = useAppearanceStore((state) => state.updateLyricsPreview);
  return (
    <SettingSection title={t("subtitlePreview.colors")}>
      <SettingRow
        label={t("subtitlePreview.preset")}
        isColumn
        control={
          <div className="flex flex-wrap gap-2">
            {SUBTITLE_COLOR_PRESETS.map(({ id, ...palette }) => (
              <Button
                key={id}
                variant="outline"
                size="sm"
                onClick={() => update(palette)}
                aria-pressed={
                  settings.color === palette.color &&
                  settings.gradientColor === palette.gradientColor &&
                  settings.colorMode === palette.colorMode
                }
              >
                <span
                  className="size-3 rounded-full"
                  style={{
                    background: `linear-gradient(90deg, ${palette.color}, ${palette.gradientColor})`,
                  }}
                />
                {t(`subtitlePreview.${id}`)}
              </Button>
            ))}
          </div>
        }
      />
      <SubtitleThemeLibrary paletteOnly />
      <SubtitlePaletteFields settings={settings} onChange={update} />
      <AppearanceRange
        label={t("subtitlePreview.blur")}
        value={settings.blur}
        min={0}
        max={32}
        unit=" px"
        onChange={(blur) => update({ blur })}
      />
      <SettingRow
        label={t("subtitlePreview.shadow")}
        control={
          <Switch
            aria-label={t("subtitlePreview.shadow")}
            checked={settings.textShadow}
            onCheckedChange={(textShadow) => update({ textShadow })}
          />
        }
      />
    </SettingSection>
  );
}
