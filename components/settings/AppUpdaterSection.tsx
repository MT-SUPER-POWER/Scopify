"use client";

import { Download, RefreshCw, Rocket } from "lucide-react";
import { UPDATE_STATUS_LABEL_KEYS } from "@/constants/updater";
import { useAppUpdater } from "@/hooks/settings/useAppUpdater";
import { useI18n } from "@/store/module/i18n";
import type { AppUpdaterSectionProps } from "@/types/components/settings";
import { SettingRow, SettingSection, Toggle } from "./SettingsUI";

export function AppUpdaterSection({ config, onChange }: AppUpdaterSectionProps) {
  const { t } = useI18n();
  const { state, check, download, install } = useAppUpdater();
  const isChecking = state.status === "checking";
  const isDownloading = state.status === "downloading";
  const hasUpdate = state.status === "available";
  const downloaded = state.status === "downloaded";
  const statusLabel =
    state.status === "downloading" && state.percent !== undefined
      ? t("settings.updater.state.downloadingProgress", {
          percent: Math.round(state.percent),
        })
      : t(UPDATE_STATUS_LABEL_KEYS[state.status]);

  return (
    <div id="app-updater" className="scroll-mt-24">
      <SettingSection title={t("settings.section.updater")}>
        <SettingRow
          label={t("settings.updater.checkOnStartup.label")}
          sublabel={t("settings.updater.checkOnStartup.sublabel")}
          control={
            <Toggle
              enabled={config.updater.checkOnStartup}
              onChange={() => onChange("updater", "checkOnStartup", !config.updater.checkOnStartup)}
            />
          }
        />
        <SettingRow
          label={t("settings.updater.autoDownload.label")}
          sublabel={t("settings.updater.autoDownload.sublabel")}
          control={
            <Toggle
              enabled={config.updater.autoDownload}
              onChange={() => onChange("updater", "autoDownload", !config.updater.autoDownload)}
            />
          }
        />
        <SettingRow
          label={t("settings.updater.status")}
          sublabel={
            state.version
              ? t("settings.updater.availableVersion", { version: state.version })
              : state.currentVersion
                ? t("settings.updater.currentVersion", { version: state.currentVersion })
                : t("settings.updater.statusHint")
          }
          control={<span className="text-sm font-semibold text-white">{statusLabel}</span>}
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
          sublabel={!state.supported ? t("settings.updater.packagedOnly") : undefined}
          control={
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void check()}
                disabled={!state.supported || isChecking || isDownloading}
                className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-bold text-black transition hover:bg-white/90 disabled:opacity-50"
              >
                <RefreshCw className="size-3.5" />
                {isChecking ? t("settings.updater.checking") : t("settings.updater.check")}
              </button>
              {hasUpdate ? (
                <button
                  type="button"
                  onClick={() => void download()}
                  disabled={isDownloading}
                  className="inline-flex items-center gap-2 rounded-full bg-[#1ed760] px-4 py-2 text-xs font-bold text-black transition hover:bg-[#3be477] disabled:opacity-50"
                >
                  <Download className="size-3.5" />
                  {t("settings.updater.download")}
                </button>
              ) : null}
              {downloaded ? (
                <button
                  type="button"
                  onClick={install}
                  className="inline-flex items-center gap-2 rounded-full bg-[#ff3b5c] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#ff5270]"
                >
                  <Rocket className="size-3.5" />
                  {t("settings.updater.install")}
                </button>
              ) : null}
            </div>
          }
        />
      </SettingSection>
    </div>
  );
}
