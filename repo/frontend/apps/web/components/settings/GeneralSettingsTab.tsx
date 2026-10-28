"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@scopify/ui/shadcn/components/select";

import {
  PLAYBACK_PROGRESS_REFRESH_RATE_LABEL_KEYS,
  PLAYBACK_PROGRESS_REFRESH_RATES,
} from "@/constants/performance";
import { languageLabelKeys } from "@/lib/i18n";
import { useI18n } from "@/store/module/i18n";
import { usePerformanceStore } from "@/store/module/performance";
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
  const { t } = useI18n();
  const progressRefreshRate = usePerformanceStore((state) => state.progressRefreshRate);
  const setProgressRefreshRate = usePerformanceStore((state) => state.setProgressRefreshRate);

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
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper">
                  {PLAYBACK_PROGRESS_REFRESH_RATES.map((rate) => (
                    <SelectItem key={rate} value={rate}>
                      {t(PLAYBACK_PROGRESS_REFRESH_RATE_LABEL_KEYS[rate])}
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
