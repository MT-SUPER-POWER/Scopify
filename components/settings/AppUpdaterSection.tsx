"use client";

import { Download, RefreshCw, Rocket } from "lucide-react";
import { useAppUpdater } from "@/hooks/settings/useAppUpdater";
import { useI18n } from "@/store/module/i18n";
import type { AppUpdateState } from "@/types/updater";
import { SettingRow, SettingSection } from "./SettingsUI";

function getUpdateLabel(state: AppUpdateState) {
  if (state.status === "downloading" && state.percent !== undefined) {
    return `Downloading ${Math.round(state.percent)}%`;
  }
  return state.status;
}

export function AppUpdaterSection() {
  const { t } = useI18n();
  const { state, check, download, install } = useAppUpdater();
  const isChecking = state.status === "checking";
  const isDownloading = state.status === "downloading";
  const hasUpdate = state.status === "available";
  const downloaded = state.status === "downloaded";

  return (
    <SettingSection title={t("settings.section.updater")}>
      <SettingRow
        label={t("settings.updater.status")}
        sublabel={
          state.version
            ? t("settings.updater.version", { version: state.version })
            : t("settings.updater.statusHint")
        }
        control={<span className="text-sm font-semibold text-white">{getUpdateLabel(state)}</span>}
      />
      {state.message ? (
        <SettingRow
          label={t("settings.updater.message")}
          sublabel={state.message}
          control={<span className="text-xs text-zinc-500" />}
        />
      ) : null}
      <SettingRow
        label={t("settings.updater.action")}
        control={
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void check()}
              disabled={isChecking || isDownloading}
              className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-bold text-black transition hover:bg-white/90 disabled:opacity-50"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              {isChecking ? t("settings.updater.checking") : t("settings.updater.check")}
            </button>
            {hasUpdate ? (
              <button
                type="button"
                onClick={() => void download()}
                disabled={isDownloading}
                className="inline-flex items-center gap-2 rounded-full bg-[#1ed760] px-4 py-2 text-xs font-bold text-black transition hover:bg-[#3be477] disabled:opacity-50"
              >
                <Download className="h-3.5 w-3.5" />
                {t("settings.updater.download")}
              </button>
            ) : null}
            {downloaded ? (
              <button
                type="button"
                onClick={install}
                className="inline-flex items-center gap-2 rounded-full bg-[#ff3b5c] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#ff5270]"
              >
                <Rocket className="h-3.5 w-3.5" />
                {t("settings.updater.install")}
              </button>
            ) : null}
          </div>
        }
      />
    </SettingSection>
  );
}
