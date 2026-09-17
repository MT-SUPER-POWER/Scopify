"use client";

import { useAppearanceStore } from "@/store/module/appearance";
import { useI18n } from "@/store/module/i18n";
import type { LyricsPreviewSettings } from "@/types/appearance";
import { AppearanceRange } from "./AppearanceRange";
import { SettingRow, SettingSection, SettingSelect } from "./SettingsUI";

export function SubtitleMotionSettings() {
  const { t } = useI18n();
  const settings = useAppearanceStore((state) => state.lyricsPreview);
  const update = useAppearanceStore((state) => state.updateLyricsPreview);
  return (
    <SettingSection title={t("subtitlePreview.motion")}>
      <SettingRow
        label={t("subtitlePreview.motion")}
        control={
          <SettingSelect
            value={settings.entrance}
            onChange={(entrance) =>
              update({
                entrance: entrance as LyricsPreviewSettings["entrance"],
                ...(entrance === "typewriter" ? { fillEnabled: false } : {}),
              })
            }
          >
            {(["none", "fade", "slide", "scale", "typewriter"] as const).map((mode) => (
              <option key={mode} value={mode} className="bg-popover">
                {t(`subtitlePreview.${mode}`)}
              </option>
            ))}
          </SettingSelect>
        }
      />
      {settings.entrance !== "none" && settings.entrance !== "typewriter" && (
        <AppearanceRange
          label={t("subtitlePreview.duration")}
          value={settings.animationDuration}
          min={100}
          max={1200}
          step={50}
          unit=" ms"
          onChange={(animationDuration) => update({ animationDuration })}
        />
      )}
      {settings.entrance === "typewriter" && (
        <AppearanceRange
          label={t("subtitlePreview.interval")}
          value={settings.characterInterval}
          min={20}
          max={240}
          step={10}
          unit=" ms"
          onChange={(characterInterval) => update({ characterInterval })}
        />
      )}
    </SettingSection>
  );
}
