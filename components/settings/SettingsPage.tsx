"use client";

import { languageLabelKeys } from "@/lib/i18n";
import { IS_ELECTRON } from "@/lib/utils";
import { useI18n } from "@/store/module/i18n";
import { APP_LOCALES, type AppConfig, type AppLocale } from "@/types/config";
import { useSettingsState } from "@/hooks/settings/useSettingsState";
import {
  SaveChangesButton,
  SaveConfirmModal,
  SettingInput,
  SettingRow,
  SettingSection,
  SettingSelect,
  SettingsLoadingState,
  Toggle,
} from "./SettingsUI";

const SettingsPage = () => {
  const { t } = useI18n();
  const {
    config,
    hasChanges,
    isModalOpen,
    isSaving,
    requiresRestart,
    setIsModalOpen,
    handleLocalChange,
    handleConfirmSave,
  } = useSettingsState();

  if (!config) {
    return <SettingsLoadingState />;
  }

  const isCustomProxy = config.network.proxyMode === "custom";

  return (
    <div className="w-full bg-[#121212] rounded-lg shadow-2xl p-10 md:p-14 text-[#b3b3b3] flex flex-col min-h-[80vh] relative">
      <div className="flex justify-between items-center mb-10 mt-4.5">
        <h1 className="text-white text-4xl md:text-5xl font-black tracking-tight">
          {t("settings.title")}
        </h1>
      </div>

      <div className="flex flex-col">
        <div className="grow grid grid-cols-1 lg:grid-cols-2 gap-x-16 gap-y-10 items-start pb-20">
          <div className="flex flex-col gap-10">
            <SettingSection title={t("settings.section.application")}>
              <SettingRow
                label={t("settings.language.label")}
                sublabel={t("settings.language.sublabel")}
                control={
                  <SettingSelect
                    value={config.app.locale}
                    onChange={(value) => handleLocalChange("app", "locale", value as AppLocale)}
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
                        onChange={() =>
                          handleLocalChange("app", "gpuAcceleration", !config.app.gpuAcceleration)
                        }
                      />
                    }
                  />
                  <SettingRow
                    label={t("settings.devTools.label")}
                    requiresRestart
                    control={
                      <Toggle
                        enabled={config.app.devTools}
                        onChange={() => handleLocalChange("app", "devTools", !config.app.devTools)}
                      />
                    }
                  />
                  <SettingRow
                    label={t("settings.windowClose.label")}
                    control={
                      <SettingSelect
                        value={config.app.closeAction}
                        onChange={(value) =>
                          handleLocalChange("app", "closeAction", Number(value) as 0 | 1 | 2)
                        }
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

            <SettingSection title={t("settings.section.network")}>
              <SettingRow
                label={t("settings.timeout.label")}
                sublabel={t("settings.timeout.sublabel")}
                control={
                  <SettingInput
                    type="number"
                    value={config.network.timeout}
                    onChange={(value) => handleLocalChange("network", "timeout", Number(value))}
                  />
                }
              />
              <SettingRow
                label={t("settings.maxRetries.label")}
                sublabel={t("settings.maxRetries.sublabel")}
                control={
                  <SettingInput
                    type="number"
                    value={config.network.max_retries}
                    onChange={(value) => handleLocalChange("network", "max_retries", Number(value))}
                  />
                }
              />
              <SettingRow
                label={t("settings.retryDelay.label")}
                sublabel={t("settings.retryDelay.sublabel")}
                control={
                  <SettingInput
                    type="number"
                    value={config.network.retry_delay}
                    onChange={(value) => handleLocalChange("network", "retry_delay", Number(value))}
                  />
                }
              />
              <SettingRow
                label={t("settings.randomCNIP.label")}
                sublabel={t("settings.randomCNIP.sublabel")}
                control={
                  <SettingSelect
                    value={config.network.randomCNIP}
                    onChange={(value) => handleLocalChange("network", "randomCNIP", value)}
                  >
                    <option value="false" className="bg-[#282828]">
                      {t("settings.randomCNIP.disabled")}
                    </option>
                    <option value="true" className="bg-[#282828]">
                      {t("settings.randomCNIP.enabled")}
                    </option>
                  </SettingSelect>
                }
              />

              {IS_ELECTRON ? (
                <>
                  <SettingRow
                    label={t("settings.proxyMode.label")}
                    sublabel={t("settings.proxyMode.sublabel")}
                    control={
                      <SettingSelect
                        value={config.network.proxyMode}
                        onChange={(value) =>
                          handleLocalChange(
                            "network",
                            "proxyMode",
                            value as AppConfig["network"]["proxyMode"],
                          )
                        }
                      >
                        <option value="system" className="bg-[#282828]">
                          {t("settings.proxyMode.system")}
                        </option>
                        <option value="direct" className="bg-[#282828]">
                          {t("settings.proxyMode.direct")}
                        </option>
                        <option value="custom" className="bg-[#282828]">
                          {t("settings.proxyMode.custom")}
                        </option>
                      </SettingSelect>
                    }
                  />
                  <SettingRow
                    label={t("settings.proxyUrl.label")}
                    sublabel={t("settings.proxyUrl.sublabel")}
                    control={
                      <SettingInput
                        value={config.network.proxyUrl}
                        onChange={(value) => handleLocalChange("network", "proxyUrl", value)}
                        className="w-64"
                        placeholder={t("settings.proxyUrl.placeholder")}
                        disabled={!isCustomProxy}
                      />
                    }
                  />
                </>
              ) : null}
            </SettingSection>
          </div>

          {IS_ELECTRON ? (
            <div className="flex flex-col gap-10">
              <SettingSection title={t("settings.section.logging")}>
                <SettingRow
                  label={t("settings.logLevel.label")}
                  control={
                    <SettingSelect
                      value={config.logging.level}
                      onChange={(value) =>
                        handleLocalChange(
                          "logging",
                          "level",
                          value as AppConfig["logging"]["level"],
                        )
                      }
                    >
                      <option value="debug" className="bg-[#282828]">
                        {t("settings.logLevel.debug")}
                      </option>
                      <option value="info" className="bg-[#282828]">
                        {t("settings.logLevel.info")}
                      </option>
                      <option value="warn" className="bg-[#282828]">
                        {t("settings.logLevel.warn")}
                      </option>
                      <option value="error" className="bg-[#282828]">
                        {t("settings.logLevel.error")}
                      </option>
                    </SettingSelect>
                  }
                />
                <SettingRow
                  label={t("settings.keepDays.label")}
                  sublabel={t("settings.keepDays.sublabel")}
                  control={
                    <SettingInput
                      type="number"
                      value={config.logging.keepDays}
                      onChange={(value) => handleLocalChange("logging", "keepDays", Number(value))}
                    />
                  }
                />
              </SettingSection>

              <SettingSection title={t("settings.section.backend")}>
                <SettingRow
                  label={t("settings.autoStartBackend.label")}
                  requiresRestart
                  control={
                    <Toggle
                      enabled={config.backend.autoStart}
                      onChange={() =>
                        handleLocalChange("backend", "autoStart", !config.backend.autoStart)
                      }
                    />
                  }
                />
                <SettingRow
                  label={t("settings.backendHost.label")}
                  requiresRestart
                  control={
                    <SettingInput
                      value={config.backend.host}
                      onChange={(value) => handleLocalChange("backend", "host", value)}
                    />
                  }
                />
                <SettingRow
                  label={t("settings.backendPort.label")}
                  requiresRestart
                  control={
                    <SettingInput
                      type="number"
                      value={config.backend.port}
                      onChange={(value) => handleLocalChange("backend", "port", Number(value))}
                    />
                  }
                />
              </SettingSection>

              {process.env.NODE_ENV !== "production" ? (
                <SettingSection title={t("settings.section.frontend")}>
                  <SettingRow
                    label={t("settings.frontendHost.label")}
                    requiresRestart
                    control={
                      <SettingInput
                        value={config.frontend.host}
                        onChange={(value) => handleLocalChange("frontend", "host", value)}
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
                        onChange={(value) =>
                          handleLocalChange("frontend", "devPort", Number(value))
                        }
                      />
                    }
                  />
                </SettingSection>
              ) : null}
            </div>
          ) : null}
        </div>

        <SaveChangesButton visible={hasChanges} onClick={() => setIsModalOpen(true)} />
      </div>

      <SaveConfirmModal
        open={isModalOpen}
        isSaving={isSaving}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmSave}
        requiresRestart={requiresRestart}
        isWeb={!IS_ELECTRON}
      />
    </div>
  );
};

export default SettingsPage;
