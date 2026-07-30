"use client";

import { useI18n } from "@/store/module/i18n";
import type { DesktopProxyMode } from "@scopify/desktop-contract";
import type {
  DesktopSettingsChangeHandler,
  SettingsConfig,
  WebSettingsChangeHandler,
} from "@/types/settings";
import { SettingInput, SettingRow, SettingSection, SettingSelect } from "./SettingsUI";

interface NetworkSettingsTabProps {
  config: SettingsConfig;
  onDesktopChange: DesktopSettingsChangeHandler;
  onWebChange: WebSettingsChangeHandler;
}

export function NetworkSettingsTab({
  config,
  onDesktopChange,
  onWebChange,
}: NetworkSettingsTabProps) {
  const { t } = useI18n();
  const isCustomProxy = config.desktop?.network.proxyMode === "custom";

  return (
    <div className="grid grid-cols-1 items-start gap-x-16 gap-y-10 lg:grid-cols-2">
      <SettingSection title={t("settings.section.backend")}>
        <SettingRow
          label={t("settings.backendHost.label")}
          sublabel={t("settings.backendHost.sublabel")}
          control={
            <SettingInput
              value={config.web.backend.host}
              onChange={(value) => onWebChange("backend", "host", value)}
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
              value={config.web.backend.port}
              onChange={(value) => onWebChange("backend", "port", Number(value) || 0)}
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
              value={config.web.network.timeout}
              onChange={(value) => onWebChange("network", "timeout", Number(value))}
            />
          }
        />
        <SettingRow
          label={t("settings.randomCNIP.label")}
          sublabel={t("settings.randomCNIP.sublabel")}
          control={
            <SettingSelect
              value={config.web.network.randomCNIP}
              onChange={(value) =>
                onWebChange("network", "randomCNIP", value === "true" ? "true" : "false")
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
        {config.desktop ? (
          <>
            <SettingRow
              label={t("settings.proxyMode.label")}
              sublabel={t("settings.proxyMode.sublabel")}
              control={
                <SettingSelect
                  value={config.desktop.network.proxyMode}
                  onChange={(value) =>
                    onDesktopChange("network", "proxyMode", value as DesktopProxyMode)
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
                  value={config.desktop.network.proxyUrl}
                  onChange={(value) => onDesktopChange("network", "proxyUrl", value)}
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
