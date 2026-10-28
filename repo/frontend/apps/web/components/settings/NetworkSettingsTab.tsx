"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@scopify/ui/shadcn/components/select";

import { CircleCheck, CircleX, LoaderCircle, Radio } from "lucide-react";
import { SETTINGS_ACTION_BUTTON_CLASS_NAME } from "@/constants/settings";
import type { DesktopProxyMode } from "@scopify/desktop-contract";
import type { NetworkSettingsTabProps } from "@/types/settings/components";
import { isBackendHostInputValid } from "@/lib/web/backendUrl";
import { useI18n } from "@/store/module/i18n";
import { SettingInput, SettingRow, SettingSection } from "./SettingsUI";

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
          ? "flex items-center gap-1 text-xs font-medium text-success"
          : "flex items-center gap-1 text-xs font-medium text-danger"
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
            <Select
              value={String(config.web.backend.protocol)}
              onValueChange={(value) =>
                onWebChange("backend", "protocol", value as "http" | "https")
              }
            >
              <SelectTrigger aria-label={t("settings.backendProtocol.label")} className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value="http">HTTP</SelectItem>
                <SelectItem value="https">HTTPS</SelectItem>
              </SelectContent>
            </Select>
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
                <span className="max-w-50 text-right text-xs font-medium text-danger">
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
          label={t("settings.backendPing.label")}
          isDebug
          badge={pingBadge}
          sublabel={t("settings.backendPing.sublabel")}
          control={
            <button
              type="button"
              onClick={() => void onPingBackend()}
              disabled={isPingingBackend}
              className={`${SETTINGS_ACTION_BUTTON_CLASS_NAME} disabled:cursor-wait`}
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
