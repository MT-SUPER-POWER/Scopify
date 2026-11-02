import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@scopify/ui/shadcn/components/select";
import { useTranslation } from "react-i18next";

import type { SubtitlePaletteFieldsProps } from "@/types/lyrics/subtitlePreview";
import { AppearanceRange } from "./AppearanceRange";
import { SettingRow } from "./SettingsUI";
import { ThemeColorControl } from "./ThemeColorControl";

export function SubtitlePaletteFields({
  settings,
  onChange: update,
  readOnly = false,
}: SubtitlePaletteFieldsProps) {
  const { t } = useTranslation();
  return (
    <>
      <SettingRow
        label={t("subtitlePreview.mode")}
        control={
          readOnly ? (
            t(settings.colorMode === "solid" ? "subtitlePreview.solid" : "subtitlePreview.gradient")
          ) : (
            <Select
              value={String(settings.colorMode)}
              onValueChange={(colorMode) =>
                update({ colorMode: colorMode as "solid" | "gradient" })
              }
            >
              <SelectTrigger aria-label={t("subtitlePreview.mode")} className="min-w-30">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value="solid">{t("subtitlePreview.solid")}</SelectItem>
                <SelectItem value="gradient">{t("subtitlePreview.gradient")}</SelectItem>
              </SelectContent>
            </Select>
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
