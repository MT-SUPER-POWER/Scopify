"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@scopify/ui/shadcn/components/select";

import type { SubtitleSettingsEditorProps } from "@/types/subtitle-preview";
import { useI18n } from "@/store/module/i18n";
import type { LyricsPreviewSettings } from "@/types/appearance";
import { AppearanceRange } from "./AppearanceRange";
import { SettingRow, SettingSection } from "./SettingsUI";

export function SubtitleMotionSettings({
  settings,
  onChange: update,
}: SubtitleSettingsEditorProps) {
  const { t } = useI18n();
  return (
    <SettingSection title={t("subtitlePreview.motion")}>
      <SettingRow
        label={t("subtitlePreview.motion")}
        control={
          <Select
            value={String(settings.entrance)}
            onValueChange={(entrance) =>
              update({
                entrance: entrance as LyricsPreviewSettings["entrance"],
              })
            }
          >
            <SelectTrigger aria-label={t("subtitlePreview.motion")} className="min-w-30">
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper">
              {(["none", "fade", "slide", "scale", "typewriter"] as const).map((mode) => (
                <SelectItem key={mode} value={String(mode)}>
                  {t(`subtitlePreview.${mode}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
