"use client";

import { CircleCheck, CircleX, LoaderCircle, Radio } from "lucide-react";
import type { DesktopProxyMode } from "@scopify/desktop-contract";
import type { NetworkSettingsTabProps } from "@/types/components/settings";
import { isBackendHostInputValid } from "@/lib/web/backendUrl";
import { useI18n } from "@/store/module/i18n";
import { SettingInput, SettingRow, SettingSection, SettingSelect } from "./SettingsUI";

export function NetworkSettingsTab({
  backendPingResult,
  config,
  isPingingBackend,
  onDesktopChange,
  onPingBackend,
  onWebChange,
  onBackendHostBlur,
}: NetworkSettingsTabProps) {
  const { t } = useI18n();
  const isCustomProxy = config.desktop?.network.proxyMode === "custom";

  const hostTrimmed = config.web.backend.host.trim();
  const isHostInvalid = hostTrimmed !== "" && !isBackendHostInputValid(hostTrimmed);

  const pingBadge = backendPingResult ? (
    <span
      aria-live="polite"
      className={
        backendPingResult.reachable
          ? "text-success flex items-center gap-1 text-xs font-medium"
          : "text-danger flex items-center gap-1 text-xs font-medium"
      }
    >
      {backendPingResult.reachable ? (
        <CircleCheck className="size-3.5" />
      ) : (
        <CircleX className="size-3.5" />
      )}
      {backendPingResult.reachable
        ? backendPingResult.version
          ? t("settings.backendPing.successWithVersion", {
              latency: backendPingResult.latencyMs,
              version: backendPingResult.version.startsWith("v")
                ? backendPingResult.version
                : `v${backendPingResult.version}`,
            })
          : t("settings.backendPing.success", {
              latency: backendPingResult.latencyMs,
            })
        : backendPingResult.reason === "timeout"
          ? t("settings.backendPing.timeout")
          : backendPingResult.reason === "invalid-response"
            ? t("settings.backendPing.invalidResponse")
            : backendPingResult.reason === "server"
              ? t("settings.backendPing.serverError", { status: backendPingResult.status ?? 0 })
              : t("settings.backendPing.networkError")}
    </span>
  ) : null;

  return (
    <div className="grid grid-cols-1 items-start gap-x-16 gap-y-10 lg:grid-cols-2">
      <SettingSection title={t("settings.section.backend")}>
        <SettingRow
          label={t("settings.backendProtocol.label")}
          sublabel={t("settings.backendProtocol.sublabel")}
          control={
            <SettingSelect
              value={config.web.backend.protocol}
              onChange={(value) => onWebChange("backend", "protocol", value as "http" | "https")}
              className="w-28"
            >
              <option value="http" className="bg-popover">
                HTTP
              </option>
              <option value="https" className="bg-popover">
                HTTPS
              </option>
            </SettingSelect>
          }
        />
        <SettingRow
          label={t("settings.backendHost.label")}
          sublabel={t("settings.backendHost.sublabel")}
          control={
            <div className="flex flex-col items-end gap-1">
              <SettingInput
                value={config.web.backend.host}
                onChange={(value) => onWebChange("backend", "host", value)}
                onBlur={onBackendHostBlur}
                className="w-42 sm:w-50"
                placeholder={t("settings.backendHost.placeholder")}
                align="right"
                isInvalid={isHostInvalid}
              />
              {isHostInvalid ? (
                <span className="text-danger max-w-50 text-right text-xs font-medium">
                  {t("settings.backendHost.invalid")}
                </span>
              ) : null}
            </div>
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
          label={
            <div className="flex items-center gap-2">
              <span>{t("settings.backendPing.label")}</span>
              {pingBadge}
            </div>
          }
          sublabel={t("settings.backendPing.sublabel")}
          control={
            <button
              type="button"
              onClick={() => void onPingBackend()}
              disabled={isPingingBackend}
              className="border-input text-foreground hover:border-content inline-flex items-center gap-2 rounded border px-3 py-1.5 text-sm font-medium transition-colors disabled:cursor-wait disabled:opacity-50"
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
              <option value="false" className="bg-popover">
                {t("settings.randomCNIP.disabled")}
              </option>
              <option value="true" className="bg-popover">
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
                  <option value="system" className="bg-popover">
                    {t("settings.proxyMode.system")}
                  </option>
                  <option value="direct" className="bg-popover">
                    {t("settings.proxyMode.direct")}
                  </option>
                  <option value="custom" className="bg-popover">
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
