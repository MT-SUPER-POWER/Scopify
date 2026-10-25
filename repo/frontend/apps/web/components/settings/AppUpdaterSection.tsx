"use client";

import { useAppUpdater } from "@/hooks/settings/useAppUpdater";
import { useI18n } from "@/store/module/i18n";
import type { AppUpdaterSectionProps } from "@/types/components/settings";
import { AppUpdaterStatus } from "./AppUpdaterStatus";
import { SettingRow, SettingSection, Toggle } from "./SettingsUI";

export function AppUpdaterSection({ config, onChange }: AppUpdaterSectionProps) {
  const { t } = useI18n();
  const { state, check, download, install } = useAppUpdater();

  return (
    <div id="app-updater" className="scroll-mt-8">
      <SettingSection title={t("settings.section.updater")}>
        <SettingRow
          label={t("settings.updater.checkOnStartup.label")}
          sublabel={
            state.manualInstall
              ? t("settings.updater.checkOnStartup.manualHint")
              : t("settings.updater.checkOnStartup.sublabel")
          }
          control={
            <Toggle
              enabled={config.updater.checkOnStartup}
              onChange={() => onChange("updater", "checkOnStartup", !config.updater.checkOnStartup)}
            />
          }
        />
        {state.supported && !state.manualInstall ? (
          <SettingRow
            label={t("settings.updater.autoDownload.label")}
            sublabel={t("settings.updater.autoDownload.sublabel")}
            control={
              <Toggle
                enabled={config.updater.autoDownload}
                onChange={() => onChange("updater", "autoDownload", !config.updater.autoDownload)}
              />
            }
          />
        ) : null}
        <AppUpdaterStatus state={state} onCheck={check} onDownload={download} onInstall={install} />
      </SettingSection>
    </div>
  );
}
