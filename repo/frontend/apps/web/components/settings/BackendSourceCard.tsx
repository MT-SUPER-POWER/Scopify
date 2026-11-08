"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@scopify/ui/shadcn/components/select";
import { ToggleGroup, ToggleGroupItem } from "@scopify/ui/shadcn/components/toggle-group";
import { CircleCheck, CircleX, LoaderCircle, Play, Radio, RotateCw, Square } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { SETTINGS_ACTION_BUTTON_CLASS_NAME } from "@/constants/settings";
import { runtime } from "@/lib/runtime";
import { isBackendHostInputValid } from "@/lib/web/backendUrl";
import { probeBackend, probeQqBackend } from "@/lib/web/waitForBackend";
import type { BackendPingResult } from "@/types/network/model";
import type {
  BackendCustomAddressProps,
  BackendPingBadgeProps,
  BackendSourceCardProps,
  BuiltinBackendRowsProps,
} from "@/types/settings/components";
import { BackendStatusIndicator } from "./BackendStatusIndicator";
import { SettingInput, SettingPortInput, SettingRow, SettingSection } from "./SettingsUI";

const PLATFORM_TEXT = {
  netease: {
    title: "settings.backendSource.netease",
    restartSuccess: "settings.localBackend.restart.success",
    restartFailed: "settings.localBackend.restart.failed",
  },
  qq: {
    title: "settings.backendSource.qq",
    restartSuccess: "settings.qqBackend.restart.success",
    restartFailed: "settings.qqBackend.restart.failed",
  },
} as const;

/**
 * One platform's backend: the API Desktop hosts on this machine, or the alternative: a custom
 * address when `custom` is given, otherwise not running at all. In Desktop the choice is
 * `backend.<platform>.autoStart`; a running built-in API wins, so only one address is ever in
 * effect. The browser has no built-in API and shows the custom address only.
 */
export function BackendSourceCard({
  backendStatus,
  custom,
  desktopConfig,
  onDesktopChange,
  platform,
}: BackendSourceCardProps) {
  const { t } = useTranslation();
  const [isRestarting, setIsRestarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const text = PLATFORM_TEXT[platform];
  const builtinConfig = desktopConfig?.backend[platform] ?? null;
  const isBuiltin = Boolean(builtinConfig?.autoStart);
  const runtimeBackend = platform === "qq" ? runtime.qqBackend : runtime.backend;

  const alternative = custom ? "custom" : "off";
  const canRestart =
    isBuiltin && backendStatus?.source !== "external" && backendStatus?.state !== "starting";

  const updateBuiltin = (patch: Partial<NonNullable<typeof builtinConfig>>) => {
    if (builtinConfig) onDesktopChange("backend", platform, { ...builtinConfig, ...patch });
  };

  const handleRestart = async () => {
    setIsRestarting(true);
    try {
      const status = await runtimeBackend.restart();
      const restarted = status.managed && status.state === "running";
      toast[restarted ? "success" : "error"](
        t(restarted ? text.restartSuccess : text.restartFailed),
      );
    } catch {
      toast.error(t(text.restartFailed));
    } finally {
      setIsRestarting(false);
    }
  };

  const canStop = isBuiltin && backendStatus?.managed === true && backendStatus.state === "running";

  const handleStop = async () => {
    setIsStopping(true);
    try {
      await runtimeBackend.stop();
    } catch {
      toast.error(t("settings.backendSource.stopFailed"));
    } finally {
      setIsStopping(false);
    }
  };

  const status = !builtinConfig ? null : isBuiltin || !custom ? (
    <BackendStatusIndicator status={backendStatus} />
  ) : (
    <span className="text-xs font-medium text-muted-foreground">
      {t("settings.backendSource.customStatus")}
    </span>
  );

  return (
    <SettingSection title={t(text.title)} actions={status}>
      {builtinConfig ? (
        <SettingRow
          label={t("settings.backendSource.label")}
          sublabel={t(
            isBuiltin
              ? "settings.backendSource.builtinSublabel"
              : custom
                ? "settings.backendSource.customSublabel"
                : "settings.backendSource.offSublabel",
          )}
          control={
            <ToggleGroup
              type="single"
              variant="outline"
              size="sm"
              value={isBuiltin ? "builtin" : alternative}
              onValueChange={(value) => {
                if (value) updateBuiltin({ autoStart: value === "builtin" });
              }}
              aria-label={t("settings.backendSource.label")}
            >
              <ToggleGroupItem value="builtin">
                {t("settings.backendSource.builtin")}
              </ToggleGroupItem>
              <ToggleGroupItem value={alternative}>
                {t(custom ? "settings.backendSource.custom" : "settings.backendSource.off")}
              </ToggleGroupItem>
            </ToggleGroup>
          }
        />
      ) : null}
      {builtinConfig && isBuiltin ? (
        <BuiltinBackendRows
          platform={platform}
          backendStatus={backendStatus}
          canRestart={canRestart}
          canStop={canStop}
          isRunning={backendStatus?.state === "running"}
          isRestarting={isRestarting}
          isStopping={isStopping}
          onStop={() => void handleStop()}
          onPortChange={(port) => updateBuiltin({ port })}
          onRestart={() => void handleRestart()}
          port={builtinConfig.port}
        />
      ) : custom ? (
        <CustomAddressRows {...custom} />
      ) : null}
    </SettingSection>
  );
}

/** Health check per platform: NetEase answers `/inner/version`, QQ Music `/login/channels`. */
const PROBES = { netease: probeBackend, qq: probeQqBackend } as const;

function BuiltinBackendRows({
  backendStatus,
  canRestart,
  canStop,
  isRestarting,
  isRunning,
  isStopping,
  onPortChange,
  onRestart,
  onStop,
  platform,
  port,
}: BuiltinBackendRowsProps) {
  const { t } = useTranslation();
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<BackendPingResult | null>(null);
  const origin = backendStatus?.state === "running" ? backendStatus.origin : null;

  const handleTest = async () => {
    if (!origin) return;
    setIsTesting(true);
    try {
      setTestResult(await PROBES[platform](origin));
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <>
      <SettingRow
        label={t("settings.localBackend.port.label")}
        sublabel={t("settings.backendSource.builtinPortSublabel")}
        control={<SettingPortInput value={port} onChange={onPortChange} className="w-28" />}
      />
      <SettingRow
        label={t("settings.backendSource.currentAddress")}
        isDebug
        badge={testResult ? <BackendPingBadge result={testResult} /> : null}
        sublabel={origin ?? backendStatus?.error ?? "—"}
        control={
          <button
            type="button"
            onClick={() => void handleTest()}
            disabled={!origin || isTesting}
            className={`${SETTINGS_ACTION_BUTTON_CLASS_NAME} disabled:cursor-not-allowed disabled:opacity-50`}
          >
            {isTesting ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <Radio className="size-4" />
            )}
            {isTesting ? t("settings.backendPing.checking") : t("settings.backendPing.button")}
          </button>
        }
      />
      <SettingRow
        label={t("settings.backendSource.processLabel")}
        sublabel={t("settings.backendSource.restartSublabel")}
        control={
          <div className="flex items-center gap-2">
            {isRunning ? (
              <button
                type="button"
                disabled={!canStop || isStopping}
                onClick={onStop}
                className={`${SETTINGS_ACTION_BUTTON_CLASS_NAME} disabled:cursor-not-allowed disabled:opacity-50`}
              >
                {isStopping ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <Square className="size-4" />
                )}
                {t("settings.backendSource.stop")}
              </button>
            ) : null}
            <button
              type="button"
              disabled={!canRestart || isRestarting}
              onClick={onRestart}
              className={`${SETTINGS_ACTION_BUTTON_CLASS_NAME} disabled:cursor-not-allowed disabled:opacity-50`}
            >
              {isRestarting ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : isRunning ? (
                <RotateCw className="size-4" />
              ) : (
                <Play className="size-4" />
              )}
              {t(isRunning ? "settings.backendSource.restart" : "settings.backendSource.start")}
            </button>
          </div>
        }
      />
    </>
  );
}

function CustomAddressRows({
  address,
  isPinging,
  onChange,
  onHostBlur,
  onPing,
  pingResult,
}: BackendCustomAddressProps) {
  const { t } = useTranslation();
  const hostTrimmed = address.host.trim();
  const isHostInvalid = hostTrimmed !== "" && !isBackendHostInputValid(hostTrimmed);

  const pingBadge = pingResult ? <BackendPingBadge result={pingResult} /> : null;

  return (
    <>
      <SettingRow
        label={t("settings.backendProtocol.label")}
        sublabel={t("settings.backendProtocol.sublabel")}
        control={
          <Select
            value={address.protocol}
            onValueChange={(value) => onChange("protocol", value as "http" | "https")}
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
              value={address.host}
              onChange={(value) => onChange("host", value)}
              onBlur={onHostBlur}
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
          <SettingPortInput
            value={address.port}
            onChange={(port) => onChange("port", port)}
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
            onClick={() => void onPing()}
            disabled={isPinging}
            className={`${SETTINGS_ACTION_BUTTON_CLASS_NAME} disabled:cursor-wait`}
          >
            {isPinging ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <Radio className="size-4" />
            )}
            {isPinging ? t("settings.backendPing.checking") : t("settings.backendPing.button")}
          </button>
        }
      />
    </>
  );
}

function BackendPingBadge({ result }: BackendPingBadgeProps) {
  const { t } = useTranslation();
  return (
    <span
      aria-live="polite"
      className={
        result.reachable
          ? "flex items-center gap-1 text-xs font-medium text-success"
          : "flex items-center gap-1 text-xs font-medium text-danger"
      }
    >
      {result.reachable ? <CircleCheck className="size-3.5" /> : <CircleX className="size-3.5" />}
      {result.reachable
        ? result.version
          ? t("settings.backendPing.successWithVersion", {
              latency: result.latencyMs,
              version: result.version.startsWith("v") ? result.version : `v${result.version}`,
            })
          : t("settings.backendPing.success", { latency: result.latencyMs })
        : result.reason === "timeout"
          ? t("settings.backendPing.timeout")
          : result.reason === "invalid-response"
            ? t("settings.backendPing.invalidResponse")
            : result.reason === "server"
              ? t("settings.backendPing.serverError", { status: result.status ?? 0 })
              : t("settings.backendPing.networkError")}
    </span>
  );
}
