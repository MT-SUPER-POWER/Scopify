"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@scopify/ui/shadcn/components/select";

import type { DesktopProxyMode } from "@scopify/desktop-contract";
import type { NetworkSettingsTabProps } from "@/types/settings/components";
import { useTranslation } from "react-i18next";

import { BackendSourceCard } from "./BackendSourceCard";
import { SettingInput, SettingRow, SettingSection } from "./SettingsUI";

export function NetworkSettingsTab({
  backendPingResult,
  backendStatus,
  config,
  isPingingBackend,
  onDesktopChange,
  onPingBackend,
  onWebChange,
  onBackendHostBlur,
  qqBackendStatus,
}: NetworkSettingsTabProps) {
  const { t } = useTranslation();
  const isCustomProxy = config.desktop?.network.proxyMode === "custom";

  return (
    <div className="grid grid-cols-1 items-start gap-x-16 gap-y-10 lg:grid-cols-2">
      <BackendSourceCard
        platform="netease"
        desktopConfig={config.desktop}
        backendStatus={backendStatus}
        onDesktopChange={onDesktopChange}
        custom={{
          address: config.web.backend,
          pingResult: backendPingResult,
          isPinging: isPingingBackend,
          onWebChange,
          onPing: onPingBackend,
          onHostBlur: onBackendHostBlur,
        }}
      />
      {/* QQ Music's API is Desktop-only for now; the web build has no QQ backend to point at. */}
      {config.desktop ? (
        <BackendSourceCard
          platform="qq"
          desktopConfig={config.desktop}
          backendStatus={qqBackendStatus}
          onDesktopChange={onDesktopChange}
        />
      ) : null}
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
            <Select
              value={String(config.web.network.randomCNIP)}
              onValueChange={(value) =>
                onWebChange("network", "randomCNIP", value === "true" ? "true" : "false")
              }
            >
              <SelectTrigger aria-label={t("settings.randomCNIP.label")} className="min-w-30">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value="false">{t("settings.randomCNIP.disabled")}</SelectItem>
                <SelectItem value="true">{t("settings.randomCNIP.enabled")}</SelectItem>
              </SelectContent>
            </Select>
          }
        />
        {config.desktop ? (
          <>
            <SettingRow
              label={t("settings.proxyMode.label")}
              sublabel={t("settings.proxyMode.sublabel")}
              control={
                <Select
                  value={String(config.desktop.network.proxyMode)}
                  onValueChange={(value) =>
                    onDesktopChange("network", "proxyMode", value as DesktopProxyMode)
                  }
                >
                  <SelectTrigger aria-label={t("settings.proxyMode.label")} className="min-w-30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    <SelectItem value="system">{t("settings.proxyMode.system")}</SelectItem>
                    <SelectItem value="direct">{t("settings.proxyMode.direct")}</SelectItem>
                    <SelectItem value="custom">{t("settings.proxyMode.custom")}</SelectItem>
                  </SelectContent>
                </Select>
              }
            />
            <SettingRow
              label={t("settings.proxyUrl.label")}
              sublabel={t("settings.proxyUrl.sublabel")}
              control={
                <SettingInput
                  value={config.desktop.network.proxyUrl}
                  onChange={(value) => onDesktopChange("network", "proxyUrl", value)}
                  className="w-48 sm:w-56"
                  placeholder={t("settings.proxyUrl.placeholder")}
                  disabled={!isCustomProxy}
                  align="right"
                />
              }
            />
          </>
        ) : null}
      </SettingSection>
    </div>
  );
}
