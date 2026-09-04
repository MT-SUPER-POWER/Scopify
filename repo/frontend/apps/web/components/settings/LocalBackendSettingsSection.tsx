"use client";

import { LoaderCircle, RotateCw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { runtime } from "@/lib/runtime";
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
  const [isRestarting, setIsRestarting] = useState(false);
  const canRestart =
    config.backend.autoStart &&
    backendStatus?.source !== "external" &&
    backendStatus?.state !== "starting";

  const handleRestart = async () => {
    setIsRestarting(true);
    try {
      const status = await runtime.backend.restart();
      toast[status.managed && status.state === "running" ? "success" : "error"](
        t(
          status.managed && status.state === "running"
            ? "settings.localBackend.restart.success"
            : "settings.localBackend.restart.failed",
        ),
      );
    } catch {
      toast.error(t("settings.localBackend.restart.failed"));
    } finally {
      setIsRestarting(false);
    }
  };

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
      <SettingRow
        label={t("settings.localBackend.restart.label")}
        sublabel={t("settings.localBackend.restart.sublabel")}
        control={
          <button
            type="button"
            disabled={!canRestart || isRestarting}
            onClick={() => void handleRestart()}
            className="inline-flex items-center gap-2 rounded border border-input px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:border-content disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isRestarting ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <RotateCw className="size-4" />
            )}
            {isRestarting
              ? t("settings.localBackend.restart.restarting")
              : t("settings.localBackend.restart.button")}
          </button>
        }
      />
    </SettingSection>
  );
}
