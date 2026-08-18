"use client";

import { Download, RefreshCw, Rocket } from "lucide-react";
import { UPDATE_STATUS_LABEL_KEYS } from "@/constants/updater";
import { useAppUpdater } from "@/hooks/settings/useAppUpdater";
import { useI18n } from "@/store/module/i18n";
import type { AppUpdaterSectionProps } from "@/types/components/settings";
import { SettingRow, SettingSection, Toggle } from "./SettingsUI";

export function AppUpdaterSection({ config, onChange }: AppUpdaterSectionProps) {
  const { locale, t } = useI18n();
  const { state, check, download, install } = useAppUpdater();
  const isChecking = state.status === "checking";
  const isDownloading = state.status === "downloading";
  const hasUpdate = state.status === "available";
  const downloaded = state.status === "downloaded";
  const lastCheckedAt =
    typeof state.lastCheckedAt === "number" && Number.isFinite(state.lastCheckedAt)
      ? new Date(state.lastCheckedAt)
      : null;
  const formattedLastCheckedAt =
    lastCheckedAt && !Number.isNaN(lastCheckedAt.valueOf())
      ? new Intl.DateTimeFormat(locale, {
          dateStyle: "medium",
          timeStyle: "short",
        }).format(lastCheckedAt)
      : null;
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
          control={
            <span aria-live="polite" className="text-sm font-semibold text-foreground">
              {statusLabel}
            </span>
          }
        />
        {formattedLastCheckedAt && lastCheckedAt ? (
          <SettingRow
            label={t("settings.updater.lastChecked")}
            control={
              <time
                dateTime={lastCheckedAt.toISOString()}
                className="text-sm font-medium text-muted-foreground"
              >
                {formattedLastCheckedAt}
              </time>
            }
          />
        ) : null}
        {state.message ? (
          <p role="alert" className="-mt-2 mb-6 text-sm leading-relaxed text-danger">
            {t("settings.updater.message")}：{state.message}
          </p>
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
                className="inline-flex items-center gap-2 rounded-full border border-input bg-surface-raised px-4 py-2 text-xs font-bold text-foreground transition hover:bg-accent disabled:opacity-50"
              >
                <RefreshCw className={isChecking ? "size-3.5 animate-spin" : "size-3.5"} />
                {isChecking ? t("settings.updater.checking") : t("settings.updater.check")}
              </button>
              {hasUpdate ? (
                <button
                  type="button"
                  onClick={() => void download()}
                  disabled={isDownloading}
                  className="inline-flex items-center gap-2 rounded-full bg-brand px-4 py-2 text-xs font-bold text-brand-foreground transition hover:bg-brand-hover disabled:opacity-50"
                >
                  <Download className="size-3.5" />
                  {t("settings.updater.download")}
                </button>
              ) : null}
              {downloaded ? (
                <button
                  type="button"
                  onClick={install}
                  className="inline-flex items-center gap-2 rounded-full bg-brand px-4 py-2 text-xs font-bold text-brand-foreground transition hover:bg-brand-hover"
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
