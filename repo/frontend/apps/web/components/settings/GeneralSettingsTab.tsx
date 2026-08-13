"use client";

import { languageLabelKeys } from "@/lib/i18n";
import { useI18n } from "@/store/module/i18n";
import { APP_LOCALES, type AppLocale } from "@/types/config";
import type {
  DesktopSettingsChangeHandler,
  SettingsConfig,
  WebSettingsChangeHandler,
} from "@/types/settings";
import { AppearanceModeControl } from "./AppearanceModeControl";
import { SettingInput, SettingRow, SettingSection, SettingSelect, Toggle } from "./SettingsUI";

interface GeneralSettingsTabProps {
  config: SettingsConfig;
  onDesktopChange: DesktopSettingsChangeHandler;
  onWebChange: WebSettingsChangeHandler;
}

export function GeneralSettingsTab({
  config,
  onDesktopChange,
  onWebChange,
}: GeneralSettingsTabProps) {
  const { t } = useI18n();

  return (
    <div className="grid grid-cols-1 items-start gap-x-16 gap-y-10 lg:grid-cols-2">
      <div className="flex flex-col gap-10">
        <SettingSection title={t("settings.section.application")}>
          <SettingRow
            label={t("settings.language.label")}
            sublabel={t("settings.language.sublabel")}
            control={
              <SettingSelect
                value={config.web.app.locale}
                onChange={(value) => onWebChange("app", "locale", value as AppLocale)}
              >
                {APP_LOCALES.map((locale) => (
                  <option key={locale} value={locale} className="bg-popover">
                    {t(languageLabelKeys[locale])}
                  </option>
                ))}
              </SettingSelect>
            }
          />
          <AppearanceModeControl />
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
                requiresRestart
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
                  <SettingSelect
                    value={config.desktop.app.closeAction}
                    onChange={(value) =>
                      onDesktopChange("app", "closeAction", Number(value) as 0 | 1 | 2)
                    }
                  >
                    <option value={0} className="bg-popover">
                      {t("settings.windowClose.minimize")}
                    </option>
                    <option value={1} className="bg-popover">
                      {t("settings.windowClose.exit")}
                    </option>
                    <option value={2} className="bg-popover">
                      {t("settings.windowClose.ask")}
                    </option>
                  </SettingSelect>
                }
              />
            </>
          ) : null}
        </SettingSection>
      </div>
      {process.env.NODE_ENV !== "production" && config.desktop ? (
        <SettingSection title={t("settings.section.frontend")}>
          <SettingRow
            label={t("settings.frontendHost.label")}
            sublabel={t("settings.frontendHost.sublabel")}
            requiresRestart
            control={
              <SettingInput
                value={config.desktop.frontend.host}
                onChange={(value) => onDesktopChange("frontend", "host", value)}
              />
            }
          />
          <SettingRow
            label={t("settings.frontendPort.label")}
            sublabel={t("settings.frontendPort.sublabel")}
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
  );
}
