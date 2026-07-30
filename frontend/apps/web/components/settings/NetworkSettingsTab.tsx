"use client";

import { IS_ELECTRON } from "@/lib/utils";
import { useI18n } from "@/store/module/i18n";
import type { AppConfig } from "@/types/config";
import type { SettingsChangeHandler } from "@/types/settings";
import { SettingInput, SettingRow, SettingSection, SettingSelect } from "./SettingsUI";

interface NetworkSettingsTabProps {
  config: AppConfig;
  onChange: SettingsChangeHandler;
}

export function NetworkSettingsTab({ config, onChange }: NetworkSettingsTabProps) {
  const { t } = useI18n();
  const isCustomProxy = config.network.proxyMode === "custom";

  return (
    <div className="grid grid-cols-1 items-start gap-x-16 gap-y-10 lg:grid-cols-2">
      <SettingSection title={t("settings.section.backend")}>
        <SettingRow
          label={t("settings.backendHost.label")}
          sublabel={t("settings.backendHost.sublabel")}
          control={
            <SettingInput
              value={config.backend.host}
              onChange={(value) => onChange("backend", "host", value)}
              className="w-64"
              placeholder={t("settings.backendHost.placeholder")}
            />
          }
        />
        <SettingRow
          label={t("settings.backendPort.label")}
          sublabel={t("settings.backendPort.sublabel")}
          control={
            <SettingInput
              type="number"
              value={config.backend.port}
              onChange={(value) => onChange("backend", "port", Number(value) || 0)}
              className="w-28"
            />
          }
        />
      </SettingSection>
      <SettingSection title={t("settings.section.network")}>
        <SettingRow
          label={t("settings.timeout.label")}
          sublabel={t("settings.timeout.sublabel")}
          control={
            <SettingInput
              type="number"
              value={config.network.timeout}
              onChange={(value) => onChange("network", "timeout", Number(value))}
            />
          }
        />
        <SettingRow
          label={t("settings.randomCNIP.label")}
          sublabel={t("settings.randomCNIP.sublabel")}
          control={
            <SettingSelect
              value={config.network.randomCNIP}
              onChange={(value) =>
                onChange("network", "randomCNIP", value === "true" ? "true" : "false")
              }
            >
              <option value="false" className="bg-[#282828]">
                {t("settings.randomCNIP.disabled")}
              </option>
              <option value="true" className="bg-[#282828]">
                {t("settings.randomCNIP.enabled")}
              </option>
            </SettingSelect>
          }
        />
        {IS_ELECTRON ? (
          <>
            <SettingRow
              label={t("settings.proxyMode.label")}
              sublabel={t("settings.proxyMode.sublabel")}
              control={
                <SettingSelect
                  value={config.network.proxyMode}
                  onChange={(value) =>
                    onChange("network", "proxyMode", value as AppConfig["network"]["proxyMode"])
                  }
                >
                  <option value="system" className="bg-[#282828]">
                    {t("settings.proxyMode.system")}
                  </option>
                  <option value="direct" className="bg-[#282828]">
                    {t("settings.proxyMode.direct")}
                  </option>
                  <option value="custom" className="bg-[#282828]">
                    {t("settings.proxyMode.custom")}
                  </option>
                </SettingSelect>
              }
            />
            <SettingRow
              label={t("settings.proxyUrl.label")}
              sublabel={t("settings.proxyUrl.sublabel")}
              control={
                <SettingInput
                  value={config.network.proxyUrl}
                  onChange={(value) => onChange("network", "proxyUrl", value)}
                  className="w-64"
                  placeholder={t("settings.proxyUrl.placeholder")}
                  disabled={!isCustomProxy}
                />
              }
            />
          </>
        ) : null}
      </SettingSection>
    </div>
  );
}
