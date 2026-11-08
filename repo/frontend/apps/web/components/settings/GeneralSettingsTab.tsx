"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@scopify/ui/shadcn/components/select";
import { Badge } from "@scopify/ui/shadcn/components/badge";

import {
  PLAYBACK_PROGRESS_REFRESH_RATE_LABEL_KEYS,
  PLAYBACK_PROGRESS_REFRESH_RATES,
} from "@/constants/performance";
import { languageLabelKeys } from "@/lib/i18n";
import { useTranslation } from "react-i18next";

import { usePerformanceStore } from "@/store/module/performance";
import { useDisplayRefreshRate } from "@/hooks/settings/useDisplayRefreshRate";
import { APP_LOCALES, type AppLocale } from "@/types/settings/config";
import type { GeneralSettingsTabProps } from "@/types/settings/components";
import type { PlaybackProgressRefreshRate } from "@/types/core/performance";
import { AudioDeviceSettingsSection } from "./AudioDeviceSettingsSection";
import { SettingInput, SettingRow, SettingSection, Toggle } from "./SettingsUI";

export function GeneralSettingsTab({
  config,
  onDesktopChange,
  onWebChange,
}: GeneralSettingsTabProps) {
  const { t } = useTranslation();
  const progressRefreshRate = usePerformanceStore((state) => state.progressRefreshRate);
  const setProgressRefreshRate = usePerformanceStore((state) => state.setProgressRefreshRate);
  const displayRefreshRate = useDisplayRefreshRate();

  return (
    <div className="grid grid-cols-1 items-start gap-x-16 gap-y-10 lg:grid-cols-2">
      <div className="flex flex-col gap-10">
        <SettingSection title={t("settings.section.application")}>
          <SettingRow
            label={t("settings.language.label")}
            sublabel={t("settings.language.sublabel")}
            control={
              <Select
                value={String(config.web.app.locale)}
                onValueChange={(value) => onWebChange("app", "locale", value as AppLocale)}
              >
                <SelectTrigger aria-label={t("settings.language.label")} className="min-w-30">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper">
                  {APP_LOCALES.map((locale) => (
                    <SelectItem key={locale} value={String(locale)}>
                      {t(languageLabelKeys[locale])}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            }
          />
          <SettingRow
            label={t("settings.progressRefreshRate.label")}
            sublabel={t("settings.progressRefreshRate.sublabel")}
            control={
              <Select
                value={progressRefreshRate}
                onValueChange={(value) =>
                  setProgressRefreshRate(value as PlaybackProgressRefreshRate)
                }
              >
                <SelectTrigger
                  aria-label={t("settings.progressRefreshRate.label")}
                  className="min-w-30"
                >
                  <SelectValue>
                    {t(PLAYBACK_PROGRESS_REFRESH_RATE_LABEL_KEYS[progressRefreshRate])}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent position="popper" align="end" className="min-w-56">
                  {PLAYBACK_PROGRESS_REFRESH_RATES.map((rate) => (
                    <SelectItem
                      key={rate}
                      value={rate}
                      textValue={t(PLAYBACK_PROGRESS_REFRESH_RATE_LABEL_KEYS[rate])}
                    >
                      <span className="inline-flex items-center gap-2">
                        <span>
                          {t(PLAYBACK_PROGRESS_REFRESH_RATE_LABEL_KEYS[rate])}
                          {rate === "display" ? (
                            <span className="ml-1 text-muted-foreground">
                              （
                              {displayRefreshRate
                                ? t(
                                    displayRefreshRate.estimated
                                      ? "settings.progressRefreshRate.estimatedHz"
                                      : "settings.progressRefreshRate.currentHz",
                                    { hz: displayRefreshRate.hz },
                                  )
                                : t("settings.progressRefreshRate.unavailableHz")}
                              ）
                            </span>
                          ) : null}
                        </span>
                        <Badge
                          variant="outline"
                          className={
                            rate === "60"
                              ? "rounded border-success/40 bg-success/10 px-1.5 text-[10px] text-success"
                              : rate === "30"
                                ? "rounded border-warning/40 bg-warning/10 px-1.5 text-[10px] text-warning"
                                : "rounded border-info/40 bg-info/10 px-1.5 text-[10px] text-info"
                          }
                        >
                          {rate === "60"
                            ? t("settings.progressRefreshRate.recommended")
                            : rate === "30"
                              ? t("settings.progressRefreshRate.powerSaving")
                              : t("settings.progressRefreshRate.highPerformance")}
                        </Badge>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            }
          />
          {config.desktop ? (
            <>
              <SettingRow
                label={t("settings.gpu.label")}
                sublabel={t("settings.gpu.sublabel")}
                requiresRestart
                control={
                  <Toggle
                    enabled={config.desktop.app.gpuAcceleration}
                    onChange={() =>
                      onDesktopChange(
                        "app",
                        "gpuAcceleration",
                        !config.desktop?.app.gpuAcceleration,
                      )
                    }
                  />
                }
              />
              <SettingRow
                label={t("settings.devTools.label")}
                sublabel={t("settings.devTools.sublabel")}
                isDebug
                control={
                  <Toggle
                    enabled={config.desktop.app.devTools}
                    onChange={() =>
                      onDesktopChange("app", "devTools", !config.desktop?.app.devTools)
                    }
                  />
                }
              />
              <SettingRow
                label={t("settings.windowClose.label")}
                sublabel={t("settings.windowClose.sublabel")}
                control={
                  <Select
                    value={String(config.desktop.app.closeAction)}
                    onValueChange={(value) =>
                      onDesktopChange("app", "closeAction", Number(value) as 0 | 1 | 2)
                    }
                  >
                    <SelectTrigger
                      aria-label={t("settings.windowClose.label")}
                      className="min-w-30"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent position="popper">
                      <SelectItem value={String(0)}>
                        {t("settings.windowClose.minimize")}
                      </SelectItem>
                      <SelectItem value={String(1)}>{t("settings.windowClose.exit")}</SelectItem>
                      <SelectItem value={String(2)}>{t("settings.windowClose.ask")}</SelectItem>
                    </SelectContent>
                  </Select>
                }
              />
            </>
          ) : null}
        </SettingSection>
      </div>
      <div className="flex flex-col gap-10">
        <AudioDeviceSettingsSection />
        {process.env.NODE_ENV !== "production" && config.desktop ? (
          <SettingSection title={t("settings.section.frontend")}>
            <SettingRow
              label={t("settings.frontendHost.label")}
              sublabel={t("settings.frontendHost.sublabel")}
              isDebug
              requiresRestart
              control={
                <SettingInput
                  value={config.desktop.frontend.host}
                  onChange={(value) => onDesktopChange("frontend", "host", value)}
                  align="right"
                />
              }
            />

            <SettingRow
              label={t("settings.frontendPort.label")}
              sublabel={t("settings.frontendPort.sublabel")}
              isDebug
              requiresRestart
              control={
                <SettingInput
                  type="number"
                  value={config.desktop.frontend.devPort}
                  onChange={(value) => onDesktopChange("frontend", "devPort", Number(value))}
                />
              }
            />
          </SettingSection>
        ) : null}
      </div>
    </div>
  );
}
