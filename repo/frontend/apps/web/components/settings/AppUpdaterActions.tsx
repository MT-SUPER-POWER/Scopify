"use client";

import { Download, ExternalLink, RefreshCw, Rocket } from "lucide-react";
import { useI18n } from "@/store/module/i18n";
import type { AppUpdaterStatusProps } from "@/types/components/settings";

const buttonClass =
  "inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50";

export function AppUpdaterActions({
  state,
  onCheck,
  onDownload,
  onInstall,
}: AppUpdaterStatusProps) {
  const { t } = useI18n();
  const DownloadIcon = state.manualInstall ? ExternalLink : Download;

  if (state.status === "downloading") return null;

  if (state.status === "available") {
    return (
      <button
        type="button"
        onClick={() => void onDownload()}
        className={`${buttonClass} bg-brand text-brand-foreground hover:bg-brand-hover`}
      >
        <DownloadIcon aria-hidden="true" className="size-3.5" />
        {state.manualInstall ? t("settings.updater.openRelease") : t("settings.updater.download")}
      </button>
    );
  }

  if (state.status === "downloaded") {
    return state.manualInstall ? null : (
      <button
        type="button"
        onClick={onInstall}
        className={`${buttonClass} bg-brand text-brand-foreground hover:bg-brand-hover`}
      >
        <Rocket aria-hidden="true" className="size-3.5" />
        {t("settings.updater.install")}
      </button>
    );
  }

  const isChecking = state.status === "checking";
  return (
    <button
      type="button"
      onClick={() => void onCheck()}
      disabled={!state.supported || isChecking}
      className={`${buttonClass} border border-input bg-surface-raised text-foreground hover:bg-accent`}
    >
      <RefreshCw
        aria-hidden="true"
        className={`size-3.5 ${isChecking ? "animate-spin motion-reduce:animate-none" : ""}`}
      />
      {isChecking ? t("settings.updater.checking") : t("settings.updater.check")}
    </button>
  );
}
