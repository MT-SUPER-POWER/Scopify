"use client";

import { Download, ExternalLink, RefreshCw, RotateCcw } from "lucide-react";
import { UpdateProgressRing } from "@/components/notifications/UpdateProgressRing";
import { useI18n } from "@/store/module/i18n";
import type { AppUpdaterStatusProps } from "@/types/settings/components";
import { SettingButton } from "./SettingsUI";

export function AppUpdaterActions({
  state,
  onCheck,
  onDownload,
  onInstall,
}: AppUpdaterStatusProps) {
  const { t } = useI18n();
  const DownloadIcon = state.manualInstall ? ExternalLink : Download;

  if (state.status === "downloading") {
    const percent =
      typeof state.percent === "number" && Number.isFinite(state.percent)
        ? Math.min(100, Math.max(0, state.percent))
        : 0;
    return (
      <span
        role="progressbar"
        aria-label={t("settings.updater.state.downloading")}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.floor(percent)}
        className="inline-flex items-center gap-2 px-1 text-sm font-medium text-foreground tabular-nums"
      >
        <span className="relative inline-flex size-5">
          <UpdateProgressRing state={state} strokeWidth={4} />
        </span>
        {Math.floor(percent)}%
      </span>
    );
  }

  if (state.status === "available") {
    return (
      <SettingButton onClick={() => void onDownload()}>
        <DownloadIcon aria-hidden="true" className="size-4" />
        {state.manualInstall ? t("settings.updater.openRelease") : t("settings.updater.download")}
      </SettingButton>
    );
  }

  if (state.status === "downloaded") {
    return state.manualInstall ? null : (
      <SettingButton onClick={onInstall}>
        <RotateCcw aria-hidden="true" className="size-4" />
        {t("settings.updater.install")}
      </SettingButton>
    );
  }

  const isChecking = state.status === "checking";
  return (
    <SettingButton onClick={() => void onCheck()} disabled={!state.supported || isChecking}>
      <RefreshCw
        aria-hidden="true"
        className={`size-4 ${isChecking ? "animate-spin motion-reduce:animate-none" : ""}`}
      />
      {isChecking ? t("settings.updater.checking") : t("settings.updater.check")}
    </SettingButton>
  );
}
