"use client";

import { Button } from "@scopify/ui/shadcn/components/button";

import { useAppearanceStore } from "@/store/module/appearance";
import { useI18n } from "@/store/module/i18n";
import { useAppearanceBackground } from "@/hooks/settings/useAppearanceBackground";
import { BackgroundRotationControl } from "./BackgroundRotationControl";
import { AppearanceModeControl } from "./AppearanceModeControl";
import { AppearanceRange } from "./AppearanceRange";
import { BackgroundThemePicker } from "./BackgroundThemePicker";
import { SettingRow, SettingSection } from "./SettingsUI";

export function BackgroundSettingsSection() {
  const { t } = useI18n();
  const { settings: background } = useAppearanceBackground();
  const update = useAppearanceStore((state) => state.updateBackground);
  const reset = useAppearanceStore((state) => state.resetBackground);
  return (
    <SettingSection title={t("appearance.background")}>
      <AppearanceModeControl />
      <BackgroundThemePicker />
      <AppearanceRange
        label={t("appearance.intensity")}
        value={background.intensity}
        min={0}
        max={100}
        unit="%"
        onChange={(intensity) => update({ ...background, intensity, rotation: "fixed" })}
      />
      <AppearanceRange
        label={t("appearance.height")}
        value={background.height}
        min={160}
        max={720}
        step={10}
        unit=" px"
        onChange={(height) => update({ ...background, height, rotation: "fixed" })}
      />
      <BackgroundRotationControl />
      <SettingRow
        label={t("appearance.reset.background")}
        control={
          <Button variant="outline" onClick={reset}>
            {t("appearance.reset")}
          </Button>
        }
      />
    </SettingSection>
  );
}
