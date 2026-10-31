"use client";

import { useTranslation } from "react-i18next";

import { BackgroundRotationControl } from "./BackgroundRotationControl";
import { AppearanceModeControl } from "./AppearanceModeControl";
import { BackgroundThemePicker } from "./BackgroundThemePicker";
import { SettingSection } from "./SettingsUI";

export function BackgroundSettingsSection() {
  const { t } = useTranslation();
  return (
    <SettingSection title={t("appearance.background")}>
      <AppearanceModeControl />
      <BackgroundThemePicker />
      <BackgroundRotationControl />
    </SettingSection>
  );
}
