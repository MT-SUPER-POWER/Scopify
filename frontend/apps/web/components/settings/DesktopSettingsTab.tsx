"use client";

import { useI18n } from "@/store/module/i18n";
import type { DesktopLogLevel } from "@scopify/desktop-contract";
import type { DesktopSettingsTabProps } from "@/types/components/settings";
import { AppUpdaterSection } from "./AppUpdaterSection";
import { SettingInput, SettingRow, SettingSection, SettingSelect } from "./SettingsUI";

export function DesktopSettingsTab({ config, onChange }: DesktopSettingsTabProps) {
  const { t } = useI18n();

  return (
    <div className="grid grid-cols-1 items-start gap-x-16 gap-y-10 lg:grid-cols-2">
      <SettingSection title={t("settings.section.logging")}>
        <SettingRow
          label={t("settings.logLevel.label")}
          control={
            <SettingSelect
              value={config.logging.level}
              onChange={(value) => onChange("logging", "level", value as DesktopLogLevel)}
            >
              <option value="debug" className="bg-[#282828]">
                {t("settings.logLevel.debug")}
              </option>
              <option value="info" className="bg-[#282828]">
                {t("settings.logLevel.info")}
              </option>
              <option value="warn" className="bg-[#282828]">
                {t("settings.logLevel.warn")}
              </option>
              <option value="error" className="bg-[#282828]">
                {t("settings.logLevel.error")}
              </option>
            </SettingSelect>
          }
        />
        <SettingRow
          label={t("settings.keepDays.label")}
          sublabel={t("settings.keepDays.sublabel")}
          control={
            <SettingInput
              type="number"
              value={config.logging.keepDays}
              onChange={(value) => onChange("logging", "keepDays", Number(value))}
            />
          }
        />
      </SettingSection>
      <AppUpdaterSection config={config} onChange={onChange} />
    </div>
  );
}
