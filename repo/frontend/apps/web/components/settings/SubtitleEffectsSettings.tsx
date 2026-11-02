"use client";

import { Switch } from "@scopify/ui/shadcn/components/switch";
import type { SubtitleSettingsEditorProps } from "@/types/lyrics/subtitlePreview";
import { useTranslation } from "react-i18next";

import { AppearanceRange } from "./AppearanceRange";
import { SettingRow } from "./SettingsUI";

export function SubtitleEffectsSettings({
  settings,
  onChange: update,
}: SubtitleSettingsEditorProps) {
  const { t } = useTranslation();
  return (
    <div>
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
    </div>
  );
}
