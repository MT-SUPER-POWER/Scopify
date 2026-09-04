"use client";

import { Cable, CircleAlert, CircleCheck, LoaderCircle, RotateCw } from "lucide-react";
import { toast } from "sonner";

import { useI18n } from "@/store/module/i18n";
import type { McpRuntimeControlsProps } from "@/types/components/settings";
import { SettingRow } from "./SettingsUI";

/** Runs a real MCP protocol probe and keeps restart as a separate recovery action. */
export function McpRuntimeControls({
  canTestConnection,
  connectionTestResult,
  isRestarting,
  isTestingConnection,
  onRestart,
  onTestConnection,
}: McpRuntimeControlsProps) {
  const { t } = useI18n();
  const testSublabel = canTestConnection
    ? t("settings.mcp.test.sublabel")
    : t("settings.mcp.test.notReady");
  const testResult = isTestingConnection
    ? { label: t("settings.mcp.test.testing"), state: "testing" as const }
    : connectionTestResult?.success
      ? {
          label: t("settings.mcp.test.success", {
            latency: connectionTestResult.latencyMs,
            tools: connectionTestResult.toolCount,
          }),
          state: "success" as const,
        }
      : connectionTestResult
        ? { label: t("settings.mcp.test.resultFailed"), state: "failed" as const }
        : null;

  const handleTestConnection = async () => {
    try {
      const result = await onTestConnection();
      if (!result) return;
      if (result.success) toast.success(t("settings.mcp.test.successToast"));
      else toast.error(t("settings.mcp.test.failed"));
    } catch {
      toast.error(t("settings.mcp.test.failed"));
    }
  };

  const handleRestart = async () => {
    try {
      const nextStatus = await onRestart();
      if (nextStatus?.state === "error") {
        toast.error(t("settings.mcp.restart.failed", { message: nextStatus.error.message }));
      } else if (nextStatus) {
        toast.success(t("settings.mcp.restart.success"));
      }
    } catch {
      toast.error(t("settings.mcp.restart.failed", { message: t("settings.mcp.error.unknown") }));
    }
  };

  return (
    <>
      <SettingRow
        label={
          <span className="inline-flex flex-wrap items-center gap-2">
            <span>{t("settings.mcp.test.label")}</span>
            {testResult ? (
              <span
                aria-live="polite"
                className={
                  testResult.state === "success"
                    ? "inline-flex items-center gap-1 text-xs font-semibold text-success"
                    : testResult.state === "failed"
                      ? "inline-flex items-center gap-1 text-xs font-semibold text-danger"
                      : "inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground"
                }
              >
                {testResult.state === "testing" ? (
                  <LoaderCircle className="size-3.5 animate-spin" />
                ) : testResult.state === "success" ? (
                  <CircleCheck className="size-3.5" />
                ) : (
                  <CircleAlert className="size-3.5" />
                )}
                {testResult.label}
              </span>
            ) : null}
          </span>
        }
        sublabel={testSublabel}
        control={
          <button
            type="button"
            disabled={!canTestConnection || isTestingConnection}
            onClick={() => void handleTestConnection()}
            className="inline-flex items-center gap-2 rounded border border-input px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:border-content disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isTestingConnection ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : connectionTestResult?.success ? (
              <CircleCheck className="size-4 text-success" />
            ) : connectionTestResult ? (
              <CircleAlert className="size-4 text-danger" />
            ) : (
              <Cable className="size-4" />
            )}
            {isTestingConnection ? t("settings.mcp.test.testing") : t("settings.mcp.test.button")}
          </button>
        }
      />
      <SettingRow
        label={t("settings.mcp.restart.label")}
        sublabel={t("settings.mcp.restart.sublabel")}
        control={
          <button
            type="button"
            disabled={isRestarting}
            onClick={() => void handleRestart()}
            className="inline-flex items-center gap-2 rounded border border-input px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:border-content disabled:cursor-wait disabled:opacity-50"
          >
            {isRestarting ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <RotateCw className="size-4" />
            )}
            {t("settings.mcp.restart.button")}
          </button>
        }
      />
    </>
  );
}
