import { useI18n } from "@/store/module/i18n";
import type { SubtitlePaletteFieldsProps } from "@/types/subtitle-preview";
import { AppearanceRange } from "./AppearanceRange";
import { SettingRow, SettingSelect } from "./SettingsUI";
import { ThemeColorControl } from "./ThemeColorControl";

export function SubtitlePaletteFields({
  settings,
  onChange: update,
  readOnly = false,
}: SubtitlePaletteFieldsProps) {
  const { t } = useI18n();
  return (
    <>
      <SettingRow
        label={t("subtitlePreview.mode")}
        control={
          readOnly ? (
            t(settings.colorMode === "solid" ? "subtitlePreview.solid" : "subtitlePreview.gradient")
          ) : (
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
          )
        }
      />
      <ThemeColorControl
        readOnly={readOnly}
        label={t("appearance.lyrics.color")}
        value={settings.color}
        onChange={(color) => update({ color })}
      />
      {settings.colorMode === "gradient" && (
        <>
          <ThemeColorControl
            readOnly={readOnly}
            label={t("subtitlePreview.gradientColor")}
            value={settings.gradientColor}
            onChange={(gradientColor) => update({ gradientColor })}
          />
          {readOnly ? (
            <SettingRow label={t("subtitlePreview.angle")} control={`${settings.gradientAngle}°`} />
          ) : (
            <AppearanceRange
              label={t("subtitlePreview.angle")}
              value={settings.gradientAngle}
              min={0}
              max={360}
              unit="°"
              onChange={(gradientAngle) => update({ gradientAngle })}
            />
          )}
        </>
      )}
      <ThemeColorControl
        readOnly={readOnly}
        label={t("subtitleSystem.unsung")}
        value={settings.unsungColor}
        onChange={(unsungColor) => update({ unsungColor })}
      />
      <ThemeColorControl
        readOnly={readOnly}
        label={t("subtitlePreview.secondaryColor")}
        value={settings.secondaryColor}
        onChange={(secondaryColor) => update({ secondaryColor })}
      />
      <ThemeColorControl
        readOnly={readOnly}
        label={t("subtitlePreview.background")}
        value={settings.backgroundColor}
        onChange={(backgroundColor) => update({ backgroundColor })}
      />
      {readOnly ? (
        <SettingRow
          label={t("appearance.lyrics.backdrop")}
          control={`${settings.backdropOpacity}%`}
        />
      ) : (
        <AppearanceRange
          label={t("appearance.lyrics.backdrop")}
          value={settings.backdropOpacity}
          min={0}
          max={100}
          unit="%"
          onChange={(backdropOpacity) => update({ backdropOpacity })}
        />
      )}
    </>
  );
}
