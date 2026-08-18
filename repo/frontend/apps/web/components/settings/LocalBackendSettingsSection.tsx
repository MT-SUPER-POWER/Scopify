"use client";

import { SettingInput, SettingRow, SettingSection, Toggle } from "./SettingsUI";
import { BackendStatusIndicator } from "./BackendStatusIndicator";
import type { LocalBackendSettingsSectionProps } from "@/types/components/settings";
import { useI18n } from "@/store/module/i18n";

export function LocalBackendSettingsSection({
  backendStatus,
  config,
  onChange,
}: LocalBackendSettingsSectionProps) {
  const { t } = useI18n();

  return (
    <SettingSection title={t("settings.section.localBackend")}>
      <SettingRow
        label={
          <div className="flex items-center gap-2">
            <span>{t("settings.localBackend.autoStart.label")}</span>
            <BackendStatusIndicator status={backendStatus} />
          </div>
        }
        sublabel={t("settings.localBackend.autoStart.sublabel")}
        control={
          <Toggle
            enabled={config.backend.autoStart}
            onChange={() => onChange("backend", "autoStart", !config.backend.autoStart)}
          />
        }
      />
      <SettingRow
        label={t("settings.localBackend.port.label")}
        sublabel={t("settings.localBackend.port.sublabel")}
        control={
          <SettingInput
            type="number"
            value={config.backend.port}
            onChange={(value) => onChange("backend", "port", Number(value) || 0)}
            className="w-28"
          />
        }
      />
    </SettingSection>
  );
}
