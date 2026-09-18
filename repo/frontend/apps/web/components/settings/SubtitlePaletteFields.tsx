import { useI18n } from "@/store/module/i18n";
import type { SubtitleSettingsEditorProps } from "@/types/subtitle-preview";
import { AppearanceRange } from "./AppearanceRange";
import { SettingRow, SettingSelect } from "./SettingsUI";
import { ThemeColorControl } from "./ThemeColorControl";

export function SubtitlePaletteFields({ settings, onChange: update }: SubtitleSettingsEditorProps) {
  const { t } = useI18n();
  return (
    <>
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
      <ThemeColorControl
        label={t(settings.fillEnabled ? "subtitleSystem.sung" : "appearance.lyrics.color")}
        value={settings.color}
        onChange={(color) => update({ color })}
      />
      {settings.fillEnabled && (
        <ThemeColorControl
          label={t("subtitleSystem.unsung")}
          value={settings.unsungColor}
          onChange={(unsungColor) => update({ unsungColor })}
        />
      )}
      {settings.colorMode === "gradient" && (
        <>
          <ThemeColorControl
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
        <ThemeColorControl
          label={t("subtitlePreview.secondaryColor")}
          value={settings.secondaryColor}
          onChange={(secondaryColor) => update({ secondaryColor })}
        />
      )}
      <ThemeColorControl
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
    </>
  );
}
