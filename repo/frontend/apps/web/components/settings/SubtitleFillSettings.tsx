"use client";

import { Switch } from "@scopify/ui/shadcn/components/switch";
import type { SubtitleSettingsEditorProps } from "@/types/subtitle-preview";
import { useI18n } from "@/store/module/i18n";
import { SettingRow, SettingSection } from "./SettingsUI";
import { AppearanceRange } from "./AppearanceRange";

export function SubtitleFillSettings({ settings, onChange: update }: SubtitleSettingsEditorProps) {
  const { t } = useI18n();
  return (
    <SettingSection title={t("subtitleSystem.fill")}>
      <SettingRow
        label={t("subtitleSystem.fill")}
        sublabel={t("subtitleSystem.fillHint")}
        control={
          <Switch
            aria-label={t("subtitleSystem.fill")}
            checked={settings.fillEnabled}
            onCheckedChange={(fillEnabled) => update({ fillEnabled })}
          />
        }
      />
      {settings.fillEnabled && (
        <>
          <AppearanceRange
            label={t("subtitleSystem.fillDuration")}
            value={settings.fillDuration / 1000}
            min={1}
            max={15}
            step={0.5}
            unit=" s"
            onChange={(seconds) => update({ fillDuration: seconds * 1000 })}
          />
          <AppearanceRange
            label={t("subtitleSystem.softness")}
            value={settings.fillSoftness}
            min={0}
            max={50}
            unit="%"
            onChange={(fillSoftness) => update({ fillSoftness })}
          />
        </>
      )}
    </SettingSection>
  );
}
