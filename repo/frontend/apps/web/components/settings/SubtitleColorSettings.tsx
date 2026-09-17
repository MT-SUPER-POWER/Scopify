"use client";

import { SubtitleThemeLibrary } from "./SubtitleThemeLibrary";
import { Button } from "@scopify/ui/shadcn/components/button";
import { Switch } from "@scopify/ui/shadcn/components/switch";
import { SUBTITLE_COLOR_PRESETS } from "@/constants/subtitle-preview";
import { useAppearanceStore } from "@/store/module/appearance";
import { useI18n } from "@/store/module/i18n";
import { AppearanceRange } from "./AppearanceRange";
import { SettingRow, SettingSection, SettingSelect } from "./SettingsUI";
import { SubtitleColorControl } from "./SubtitleColorControl";

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
      <SettingRow
        label={t("subtitlePreview.mode")}
        control={
          <SettingSelect
            value={settings.colorMode}
            onChange={(colorMode) => update({ colorMode: colorMode as "solid" | "gradient" })}
          >
            <option value="solid" className="bg-popover">
              {t("subtitlePreview.solid")}
            </option>
            <option value="gradient" className="bg-popover">
              {t("subtitlePreview.gradient")}
            </option>
          </SettingSelect>
        }
      />
      <SubtitleColorControl
        label={t(settings.fillEnabled ? "subtitleSystem.sung" : "appearance.lyrics.color")}
        value={settings.color}
        onChange={(color) => update({ color })}
      />
      {settings.colorMode === "gradient" && (
        <>
          <SubtitleColorControl
            label={t("subtitlePreview.gradientColor")}
            value={settings.gradientColor}
            onChange={(gradientColor) => update({ gradientColor })}
          />
          <AppearanceRange
            label={t("subtitlePreview.angle")}
            value={settings.gradientAngle}
            min={0}
            max={360}
            unit="°"
            onChange={(gradientAngle) => update({ gradientAngle })}
          />
        </>
      )}
      {settings.showTranslation && (
        <SubtitleColorControl
          label={t("subtitlePreview.secondaryColor")}
          value={settings.secondaryColor}
          onChange={(secondaryColor) => update({ secondaryColor })}
        />
      )}
      <SubtitleColorControl
        label={t("subtitlePreview.background")}
        value={settings.backgroundColor}
        onChange={(backgroundColor) => update({ backgroundColor })}
      />
      <AppearanceRange
        label={t("appearance.lyrics.backdrop")}
        value={settings.backdropOpacity}
        min={0}
        max={100}
        unit="%"
        onChange={(backdropOpacity) => update({ backdropOpacity })}
      />
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
