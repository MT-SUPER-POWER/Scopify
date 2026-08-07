"use client";

import { LoaderCircle, Radio, Check, X } from "lucide-react";
import type { DesktopProxyMode } from "@scopify/desktop-contract";
import type { NetworkSettingsTabProps } from "@/types/components/settings";
import { useI18n } from "@/store/module/i18n";
import { SettingInput, SettingRow, SettingSection, SettingSelect } from "./SettingsUI";

export function NetworkSettingsTab({
  backendPingResult,
  config,
  isPingingBackend,
  onDesktopChange,
  onPingBackend,
  onWebChange,
}: NetworkSettingsTabProps) {
  const { t } = useI18n();
  const isCustomProxy = config.desktop?.network.proxyMode === "custom";

  const pingStatus = backendPingResult ? (
    backendPingResult.reachable ? (
      <span
        className="flex items-center gap-1 text-xs text-emerald-400"
        title={backendPingResult.url}
      >
        <Check className="size-3.5" />
        {t("settings.backendPing.success", { latency: backendPingResult.latencyMs })}
        {backendPingResult.version ? ` · ${backendPingResult.version}` : ""}
      </span>
    ) : (
      <span className="flex items-center gap-1 text-xs text-red-400" title={backendPingResult.url}>
        <X className="size-3.5" />
        {backendPingResult.reason === "timeout"
          ? t("settings.backendPing.timeout")
          : backendPingResult.reason === "invalid-response"
            ? t("settings.backendPing.invalidResponse")
            : backendPingResult.reason === "server"
              ? t("settings.backendPing.serverError", { status: backendPingResult.status ?? 0 })
              : t("settings.backendPing.networkError")}
      </span>
    )
  ) : null;

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
        <SettingRow
          label={t("settings.backendPing.label")}
          sublabel={t("settings.backendPing.sublabel")}
          control={
            <div className="flex min-w-28 flex-col items-end gap-2">
              <button
                type="button"
                onClick={() => void onPingBackend()}
                disabled={isPingingBackend}
                className="inline-flex items-center gap-2 rounded border border-[#727272] px-3 py-1.5 text-sm font-medium text-white transition-colors hover:border-white disabled:cursor-wait disabled:opacity-50"
              >
                {isPingingBackend ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <Radio className="size-4" />
                )}
                {isPingingBackend
                  ? t("settings.backendPing.checking")
                  : t("settings.backendPing.button")}
              </button>
              {pingStatus}
            </div>
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
