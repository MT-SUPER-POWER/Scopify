"use client";

import { Switch } from "@scopify/ui/shadcn/components/switch";
import type { SubtitleSettingsEditorProps } from "@/types/subtitle-preview";
import { SubtitleColorPresets } from "./SubtitleColorPresets";
import { useI18n } from "@/store/module/i18n";
import { AppearanceRange } from "./AppearanceRange";
import { SettingRow, SettingSection } from "./SettingsUI";
import { SubtitlePaletteFields } from "./SubtitlePaletteFields";

export function SubtitleColorSettings({ settings, onChange: update }: SubtitleSettingsEditorProps) {
  const { t } = useI18n();
  return (
    <SettingSection title={t("subtitlePreview.colors")}>
      <SubtitleColorPresets settings={settings} onChange={update} />
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
