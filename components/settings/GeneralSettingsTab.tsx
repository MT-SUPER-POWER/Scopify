"use client";

import { languageLabelKeys } from "@/lib/i18n";
import { IS_ELECTRON } from "@/lib/utils";
import { useI18n } from "@/store/module/i18n";
import { APP_LOCALES, type AppConfig, type AppLocale } from "@/types/config";
import type { SettingsChangeHandler } from "@/types/settings";
import { SettingInput, SettingRow, SettingSection, SettingSelect, Toggle } from "./SettingsUI";

interface GeneralSettingsTabProps {
  config: AppConfig;
  onChange: SettingsChangeHandler;
}

export function GeneralSettingsTab({ config, onChange }: GeneralSettingsTabProps) {
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
                value={config.app.locale}
                onChange={(value) => onChange("app", "locale", value as AppLocale)}
              >
                {APP_LOCALES.map((locale) => (
                  <option key={locale} value={locale} className="bg-[#282828]">
                    {t(languageLabelKeys[locale])}
                  </option>
                ))}
              </SettingSelect>
            }
          />
          {IS_ELECTRON ? (
            <>
              <SettingRow
                label={t("settings.gpu.label")}
                sublabel={t("settings.gpu.sublabel")}
                requiresRestart
                control={
                  <Toggle
                    enabled={config.app.gpuAcceleration}
                    onChange={() => onChange("app", "gpuAcceleration", !config.app.gpuAcceleration)}
                  />
                }
              />
              <SettingRow
                label={t("settings.devTools.label")}
                requiresRestart
                control={
                  <Toggle
                    enabled={config.app.devTools}
                    onChange={() => onChange("app", "devTools", !config.app.devTools)}
                  />
                }
              />
              <SettingRow
                label={t("settings.windowClose.label")}
                control={
                  <SettingSelect
                    value={config.app.closeAction}
                    onChange={(value) => onChange("app", "closeAction", Number(value) as 0 | 1 | 2)}
                  >
                    <option value={0} className="bg-[#282828]">
                      {t("settings.windowClose.minimize")}
                    </option>
                    <option value={1} className="bg-[#282828]">
                      {t("settings.windowClose.exit")}
                    </option>
                    <option value={2} className="bg-[#282828]">
                      {t("settings.windowClose.ask")}
                    </option>
                  </SettingSelect>
                }
              />
            </>
          ) : null}
        </SettingSection>
      </div>
      {process.env.NODE_ENV !== "production" ? (
        <SettingSection title={t("settings.section.frontend")}>
          <SettingRow
            label={t("settings.frontendHost.label")}
            requiresRestart
            control={
              <SettingInput
                value={config.frontend.host}
                onChange={(value) => onChange("frontend", "host", value)}
              />
            }
          />
          <SettingRow
            label={t("settings.frontendPort.label")}
            requiresRestart
            control={
              <SettingInput
                type="number"
                value={config.frontend.devPort}
                onChange={(value) => onChange("frontend", "devPort", Number(value))}
              />
            }
          />
        </SettingSection>
      ) : null}
    </div>
  );
}
