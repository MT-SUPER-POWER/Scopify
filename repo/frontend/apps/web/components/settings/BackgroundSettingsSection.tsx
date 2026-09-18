"use client";

import { useI18n } from "@/store/module/i18n";
import { BackgroundRotationControl } from "./BackgroundRotationControl";
import { AppearanceModeControl } from "./AppearanceModeControl";
import { BackgroundThemePicker } from "./BackgroundThemePicker";
import { SettingSection } from "./SettingsUI";

export function BackgroundSettingsSection() {
  const { t } = useI18n();
  return (
    <SettingSection title={t("appearance.background")}>
      <AppearanceModeControl />
      <BackgroundThemePicker />
      <BackgroundRotationControl />
    </SettingSection>
  );
}
