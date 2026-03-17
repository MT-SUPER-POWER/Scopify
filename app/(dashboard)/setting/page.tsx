"use client";

import { useEffect } from "react";
import { useSmartRouter } from "@/lib/hooks/useSmartRouter";
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

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ UI ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const SettingsPage = () => {
  const router = useSmartRouter();
  const isElectron = IS_ELECTRON;
  const {
    config,
    hasChanges,
    isModalOpen,
    isSaving,
    setIsModalOpen,
    handleLocalChange,
    handleConfirmSave,
  } = useSettingsState();

  useEffect(() => {
    if (!isElectron) router.replace("/");
  }, [isElectron, router]);

  if (!config) {
    return <SettingsLoadingState />;
  }

  return (
    <div className="w-full bg-[#121212] rounded-lg shadow-2xl p-10 md:p-14 text-[#b3b3b3] flex flex-col min-h-[80vh] relative">

      <div className="flex justify-between items-center mb-10 mt-4.5">
        <h1 className="text-white text-4xl md:text-5xl font-black tracking-tight">Settings</h1>
      </div>

      <div className="flex flex-col">
        {/* ━━━━━━━━━━━━━━━━━━━━ 配置列 ━━━━━━━━━━━━━━━━━━━━ */}

        <div className="grow grid grid-cols-1 lg:grid-cols-2 gap-x-16 gap-y-10 items-start pb-20">

          {/* ===================== 左列 ===================== */}
          <div className="flex flex-col gap-10">
            <SettingSection title="Application & Display">
              <SettingRow
                label="Hardware Acceleration"
                sublabel="Turn this off if the app is slow or lagging."
                control={
                  <Toggle
                    enabled={config.app.gpuAcceleration}
                    onChange={() => handleLocalChange("app", "gpuAcceleration", !config.app.gpuAcceleration)}
                  />
                }
              />
              <SettingRow
                label="Developer Tools"
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
          </div>

          {/* ===================== 右列 ===================== */}
          <div className="flex flex-col gap-10">
            <SettingSection title="Backend Service">
              <SettingRow
                label="Auto Start Backend"
                control={
                  <Toggle
                    enabled={config.backend.autoStart}
                    onChange={() => handleLocalChange("backend", "autoStart", !config.backend.autoStart)}
                  />
                }
              />
              <SettingRow
                label="Backend Host"
                control={
                  <SettingInput
                    value={config.backend.host}
                    onChange={(v) => handleLocalChange("backend", "host", v)}
                  />
                }
              />
              <SettingRow
                label="Backend Port"
                control={
                  <SettingInput
                    type="number"
                    value={config.backend.port}
                    onChange={(v) => handleLocalChange("backend", "port", Number(v))}
                  />
                }
              />
            </SettingSection>

            <SettingSection title="Frontend Service">
              <SettingRow
                label="Frontend Host"
                control={
                  <SettingInput
                    value={config.frontend.host}
                    onChange={(v) => handleLocalChange("frontend", "host", v)}
                  />
                }
              />
              <SettingRow
                label="Development Port"
                control={
                  <SettingInput
                    type="number"
                    value={config.frontend.devPort}
                    onChange={(v) => handleLocalChange("frontend", "devPort", Number(v))}
                  />
                }
              />
            </SettingSection>

            <SettingSection title="Network">
              <SettingRow
                label="Timeout (ms)"
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
                control={
                  <SettingInput
                    type="number"
                    value={config.network.retry_delay}
                    onChange={(v) => handleLocalChange("network", "retry_delay", Number(v))}
                  />
                }
              />
            </SettingSection>
          </div>
        </div>

        <SaveChangesButton visible={hasChanges} onClick={() => setIsModalOpen(true)} />
      </div>

      <SaveConfirmModal
        open={isModalOpen}
        isSaving={isSaving}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmSave}
      />
    </div>
  );
};

export default SettingsPage;
