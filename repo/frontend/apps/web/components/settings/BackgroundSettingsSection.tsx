"use client";

import { Button } from "@scopify/ui/shadcn/components/button";

import { useAppearanceStore } from "@/store/module/appearance";
import { useI18n } from "@/store/module/i18n";
import { BackgroundRotationControl } from "./BackgroundRotationControl";
import { AppearanceModeControl } from "./AppearanceModeControl";
import { BackgroundThemePicker } from "./BackgroundThemePicker";
import { SettingRow, SettingSection } from "./SettingsUI";

export function BackgroundSettingsSection() {
  const { t } = useI18n();
  const reset = useAppearanceStore((state) => state.resetBackground);
  return (
    <SettingSection title={t("appearance.background")}>
      <AppearanceModeControl />
      <BackgroundThemePicker />
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
