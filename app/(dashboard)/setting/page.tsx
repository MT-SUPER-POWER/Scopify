"use client";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ PACKAGE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { IS_ELECTRON } from "@/lib/utils";
import {
  SaveChangesButton,
  SaveConfirmModal,
  SettingInput,
  SettingRow,
  SettingSection,
  SettingSelect,
  SettingsLoadingState,
  Toggle,
} from "./settings-ui";
import { useSettingsState } from "./useSettingsState";
import { Select } from "@/components/ui/select";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ UI ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const SettingsPage = () => {
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

  return (
    <div className="w-full bg-[#121212] rounded-lg shadow-2xl p-10 md:p-14 text-[#b3b3b3] flex flex-col min-h-[80vh] relative">

      <div className="flex justify-between items-center mb-10 mt-4.5">
        <h1 className="text-white text-4xl md:text-5xl font-black tracking-tight">Settings</h1>
      </div>

      <div className="flex flex-col">
        <div className="grow grid grid-cols-1 lg:grid-cols-2 gap-x-16 gap-y-10 items-start pb-20">

          {/* ===================== 左列 ===================== */}
          <div className="flex flex-col gap-10">

            {/* Application & Display — 仅 Electron */}
            {IS_ELECTRON && (
              <SettingSection title="Application & Display">
                <SettingRow
                  label="Hardware Acceleration"
                  sublabel="Turn this off if the app is slow or lagging."
                  requiresRestart
                  control={
                    <Toggle
                      enabled={config.app.gpuAcceleration}
                      onChange={() => handleLocalChange("app", "gpuAcceleration", !config.app.gpuAcceleration)}
                    />
                  }
                />
                <SettingRow
                  label="Developer Tools"
                  requiresRestart
                  control={
                    <Toggle
                      enabled={config.app.devTools}
                      onChange={() => handleLocalChange("app", "devTools", !config.app.devTools)}
                    />
                  }
                />
                <SettingRow
                  label="Window Close Action"
                  control={
                    <SettingSelect
                      value={config.app.closeAction}
                      onChange={(value) => handleLocalChange("app", "closeAction", Number(value) as 0 | 1 | 2)}
                    >
                      <option value={0} className="bg-[#282828]">Minimize to Tray</option>
                      <option value={1} className="bg-[#282828]">Exit Application</option>
                      <option value={2} className="bg-[#282828]">Ask Every Time</option>
                    </SettingSelect>
                  }
                />
              </SettingSection>
            )}

            {/* Logging & Diagnostics — 仅 Electron */}
            {IS_ELECTRON && (
              <SettingSection title="Logging & Diagnostics">
                <SettingRow
                  label="Log Level"
                  control={
                    <SettingSelect
                      value={config.logging.level}
                      onChange={(value) => handleLocalChange("logging", "level", value as "debug" | "info" | "warn" | "error")}
                    >
                      <option value="debug" className="bg-[#282828]">Debug</option>
                      <option value="info" className="bg-[#282828]">Info</option>
                      <option value="warn" className="bg-[#282828]">Warn</option>
                      <option value="error" className="bg-[#282828]">Error</option>
                    </SettingSelect>
                  }
                />
                <SettingRow
                  label="Keep Days"
                  sublabel="Number of days to retain log files."
                  control={
                    <SettingInput
                      type="number"
                      value={config.logging.keepDays}
                      onChange={(v) => handleLocalChange("logging", "keepDays", Number(v))}
                    />
                  }
                />
              </SettingSection>
            )}

            {/* Network — 全平台可用 */}
            <SettingSection title="Network">
              <SettingRow
                label="Timeout (ms)"
                sublabel="Request timeout in milliseconds."
                control={
                  <SettingInput
                    type="number"
                    value={config.network.timeout}
                    onChange={(v) => handleLocalChange("network", "timeout", Number(v))}
                  />
                }
              />
              <SettingRow
                label="Max Retries"
                sublabel="Number of times to retry a failed request."
                control={
                  <SettingInput
                    type="number"
                    value={config.network.max_retries}
                    onChange={(v) => handleLocalChange("network", "max_retries", Number(v))}
                  />
                }
              />
              <SettingRow
                label="Retry Delay (ms)"
                sublabel="Delay between retry attempts."
                control={
                  <SettingInput
                    type="number"
                    value={config.network.retry_delay}
                    onChange={(v) => handleLocalChange("network", "retry_delay", Number(v))}
                  />
                }
              />
              <SettingRow
                label="Use Random CN IPs"
                sublabel="Select IP source for bypassing geo-restrictions."
                control={
                  <Select
                    value={config.network.randomCNIP}
                    onValueChange={(value: string) => handleLocalChange("network", "randomCNIP", value)}
                  >
                    <option value="false">Disabled</option>
                    <option value="true">Random CN IP</option>
                  </Select>
                }
              />
            </SettingSection>
          </div>

          {/* ===================== 右列 — 仅 Electron ===================== */}
          {IS_ELECTRON && (
            <div className="flex flex-col gap-10">
              <SettingSection title="Backend Service">
                <SettingRow
                  label="Auto Start Backend"
                  requiresRestart
                  control={
                    <Toggle
                      enabled={config.backend.autoStart}
                      onChange={() => handleLocalChange("backend", "autoStart", !config.backend.autoStart)}
                    />
                  }
                />
                <SettingRow
                  label="Backend Host"
                  requiresRestart
                  control={
                    <SettingInput
                      value={config.backend.host}
                      onChange={(v) => handleLocalChange("backend", "host", v)}
                    />
                  }
                />
                <SettingRow
                  label="Backend Port"
                  requiresRestart
                  control={
                    <SettingInput
                      type="number"
                      value={config.backend.port}
                      onChange={(v) => handleLocalChange("backend", "port", Number(v))}
                    />
                  }
                />
              </SettingSection>

              {/* 仅开发环境可见，打包后隐藏 */}
              {process.env.NODE_ENV !== "production" && (
                <SettingSection title="Frontend Service">
                  <SettingRow
                    label="Frontend Host"
                    requiresRestart
                    control={
                      <SettingInput
                        value={config.frontend.host}
                        onChange={(v) => handleLocalChange("frontend", "host", v)}
                      />
                    }
                  />
                  <SettingRow
                    label="Development Port"
                    requiresRestart
                    control={
                      <SettingInput
                        type="number"
                        value={config.frontend.devPort}
                        onChange={(v) => handleLocalChange("frontend", "devPort", Number(v))}
                      />
                    }
                  />
                </SettingSection>
              )}
            </div>
          )}
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
