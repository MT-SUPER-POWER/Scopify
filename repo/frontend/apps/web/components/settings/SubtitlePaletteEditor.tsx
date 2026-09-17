import { SubtitleColorControl } from "./SubtitleColorControl";
import { AppearanceRange } from "./AppearanceRange";
import { useI18n } from "@/store/module/i18n";
import type { SubtitlePaletteEditorProps } from "@/types/subtitle-preview";
import { SettingRow, SettingSelect } from "./SettingsUI";

export function SubtitlePaletteEditor({ settings, onChange }: SubtitlePaletteEditorProps) {
  const { t } = useI18n();
  return (
    <div>
      <div
        className="mb-4 rounded-lg p-4 text-center text-xl font-semibold"
        style={{ backgroundColor: settings.backgroundColor }}
      >
        <span
          style={
            settings.colorMode === "gradient"
              ? {
                  backgroundImage: `linear-gradient(${settings.gradientAngle}deg, ${settings.color}, ${settings.gradientColor})`,
                  backgroundClip: "text",
                  color: "transparent",
                }
              : { color: settings.color }
          }
        >
          {t("appearance.lyrics.text")}
        </span>
      </div>
      <SettingRow
        label={t("subtitlePreview.mode")}
        control={
          <SettingSelect
            value={settings.colorMode}
            onChange={(value) =>
              onChange({ ...settings, colorMode: value as "solid" | "gradient" })
            }
          >
            <option value="solid">{t("subtitlePreview.solid")}</option>
            <option value="gradient">{t("subtitlePreview.gradient")}</option>
          </SettingSelect>
        }
      />
      {(
        [
          ["color", "subtitleSystem.sung"],
          ["gradientColor", "subtitlePreview.gradientColor"],
          ["unsungColor", "subtitleSystem.unsung"],
          ["secondaryColor", "subtitlePreview.secondaryColor"],
          ["backgroundColor", "subtitlePreview.background"],
        ] as const
      ).map(([key, label]) => (
        <SubtitleColorControl
          key={key}
          label={t(label)}
          value={settings[key]}
          onChange={(value) => onChange({ ...settings, [key]: value })}
        />
      ))}
      <AppearanceRange
        label={t("subtitlePreview.angle")}
        value={settings.gradientAngle}
        min={0}
        max={360}
        unit="°"
        onChange={(gradientAngle) => onChange({ ...settings, gradientAngle })}
      />
      <AppearanceRange
        label={t("appearance.lyrics.backdrop")}
        value={settings.backdropOpacity}
        min={0}
        max={100}
        unit="%"
        onChange={(backdropOpacity) => onChange({ ...settings, backdropOpacity })}
      />
    </div>
  );
}
