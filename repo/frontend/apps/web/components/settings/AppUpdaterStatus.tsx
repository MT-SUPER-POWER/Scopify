"use client";

import { AlertCircle, CheckCircle2, Download, RefreshCw } from "lucide-react";
import { UPDATE_STATUS_LABEL_KEYS } from "@/constants/updater";
import { useI18n } from "@/store/module/i18n";
import type { AppUpdaterStatusProps } from "@/types/components/settings";
import { AppUpdaterActions } from "./AppUpdaterActions";

export function AppUpdaterStatus({ state, onCheck, onDownload, onInstall }: AppUpdaterStatusProps) {
  const { locale, t } = useI18n();
  const isChecking = state.status === "checking";
  const isDownloading = state.status === "downloading";
  const hasUpdate = state.status === "available";
  const downloaded = state.status === "downloaded";
  const percent =
    typeof state.percent === "number" && Number.isFinite(state.percent)
      ? Math.min(100, Math.max(0, state.percent))
      : undefined;
  const statusLabel =
    isDownloading && percent !== undefined
      ? t("settings.updater.state.downloadingProgress", { percent: Math.floor(percent) })
      : t(UPDATE_STATUS_LABEL_KEYS[state.status]);
  const StatusIcon =
    state.status === "error"
      ? AlertCircle
      : downloaded || state.status === "not-available"
        ? CheckCircle2
        : isDownloading || hasUpdate
          ? Download
          : RefreshCw;
  const lastCheckedAt =
    typeof state.lastCheckedAt === "number" && Number.isFinite(state.lastCheckedAt)
      ? new Date(state.lastCheckedAt)
      : null;
  const validLastCheckedAt =
    lastCheckedAt && !Number.isNaN(lastCheckedAt.valueOf()) ? lastCheckedAt : null;
  const hasTargetVersion = Boolean(state.version && (hasUpdate || isDownloading || downloaded));
  const statusColor =
    state.status === "error"
      ? "text-danger"
      : hasTargetVersion || state.status === "not-available"
        ? "text-brand"
        : "text-muted-foreground";

  return (
    <section
      aria-label={t("settings.updater.status")}
      className="mb-6 rounded-xl border border-border bg-surface-raised/50 p-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1.5">
          <p
            role="status"
            className="flex flex-wrap items-center gap-2 text-sm font-semibold text-foreground"
          >
            <StatusIcon
              aria-hidden="true"
              className={`size-4 shrink-0 ${statusColor} ${isChecking ? "animate-spin motion-reduce:animate-none" : ""}`}
            />
            {statusLabel}
            {hasTargetVersion ? <span className="tabular-nums">v{state.version}</span> : null}
          </p>
          {state.currentVersion ? (
            <p className="text-xs text-muted-foreground">
              {t("settings.updater.currentVersion", { version: state.currentVersion })}
            </p>
          ) : null}
        </div>
        <AppUpdaterActions
          state={state}
          onCheck={onCheck}
          onDownload={onDownload}
          onInstall={onInstall}
        />
      </div>
      {isDownloading ? (
        <progress
          aria-label={t("settings.updater.state.downloading")}
          max={100}
          value={percent}
          className="mt-4 block h-1.5 w-full overflow-hidden rounded-full border-0 bg-muted accent-brand [&::-moz-progress-bar]:bg-brand [&::-webkit-progress-bar]:rounded-full [&::-webkit-progress-bar]:bg-muted [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:bg-brand"
        />
      ) : null}
      {downloaded ? (
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          {t("notifications.updater.downloaded.description", { version: state.version ?? "" })}
        </p>
      ) : null}
      {state.manualInstall && state.supported && hasUpdate ? (
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          {t("settings.updater.manualInstallHint")}
        </p>
      ) : null}
      {!state.supported ? (
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          {t("settings.updater.packagedOnly")}
        </p>
      ) : null}
      {state.message ? (
        <p role="alert" className="mt-3 text-sm leading-relaxed break-words text-danger">
          {state.message}
        </p>
      ) : null}
      {validLastCheckedAt ? (
        <p className="mt-3 text-xs text-muted-foreground">
          {t("settings.updater.lastChecked")}
          {" · "}
          <time dateTime={validLastCheckedAt.toISOString()}>
            {new Intl.DateTimeFormat(locale, {
              dateStyle: "medium",
              timeStyle: "short",
            }).format(validLastCheckedAt)}
          </time>
        </p>
      ) : null}
    </section>
  );
}
