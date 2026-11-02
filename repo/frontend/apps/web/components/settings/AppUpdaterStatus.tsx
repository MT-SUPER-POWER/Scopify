"use client";

import { UPDATE_STATUS_LABEL_KEYS } from "@/constants/updater";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { useI18nStore } from "@/store/module/i18n";
import type { AppUpdaterStatusProps } from "@/types/settings/components";
import { AppUpdaterActions } from "./AppUpdaterActions";
import { SettingRow } from "./SettingsUI";

/** 更新状态沿用设置页的行式布局：左侧状态与版本信息，右侧操作或下载进度。 */
export function AppUpdaterStatus({ state, onCheck, onDownload, onInstall }: AppUpdaterStatusProps) {
  const { t } = useTranslation(),
    locale = useI18nStore((state) => state.locale);
  const hasTargetVersion = Boolean(
    state.version &&
    (state.status === "available" ||
      state.status === "downloading" ||
      state.status === "downloaded"),
  );
  const lastCheckedAt =
    typeof state.lastCheckedAt === "number" && Number.isFinite(state.lastCheckedAt)
      ? new Date(state.lastCheckedAt)
      : null;
  const validLastCheckedAt =
    lastCheckedAt && !Number.isNaN(lastCheckedAt.valueOf()) ? lastCheckedAt : null;

  const hint = !state.supported
    ? t("settings.updater.packagedOnly")
    : state.status === "downloaded"
      ? t("notifications.updater.downloaded.description", { version: state.version ?? "" })
      : state.manualInstall && state.status === "available"
        ? t("settings.updater.manualInstallHint")
        : null;
  const meta = [
    state.currentVersion
      ? t("settings.updater.currentVersion", { version: state.currentVersion })
      : null,
    validLastCheckedAt
      ? `${t("settings.updater.lastChecked")} ${new Intl.DateTimeFormat(locale, {
          dateStyle: "medium",
          timeStyle: "short",
        }).format(validLastCheckedAt)}`
      : null,
  ]
    .filter(Boolean)
    .join(" · ");
  const sublabel = [meta, hint].filter(Boolean).join("\n");

  return (
    <div role="status" aria-label={t("settings.updater.status")}>
      <SettingRow
        label={
          <>
            {t(UPDATE_STATUS_LABEL_KEYS[state.status])}
            {hasTargetVersion ? <span className="ml-2 tabular-nums">v{state.version}</span> : null}
          </>
        }
        sublabel={sublabel || undefined}
        className={cn("[&_span]:whitespace-pre-line", state.message && "mb-2")}
        control={
          <AppUpdaterActions
            state={state}
            onCheck={onCheck}
            onDownload={onDownload}
            onInstall={onInstall}
          />
        }
      />
      {state.message ? (
        <p role="alert" className="mb-6 text-sm leading-relaxed break-words text-danger">
          {state.message}
        </p>
      ) : null}
    </div>
  );
}
