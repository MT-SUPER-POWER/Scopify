"use client";

import { CircleAlert, CircleCheck, LoaderCircle, RotateCw } from "lucide-react";
import { toast } from "sonner";
import type { McpStatus } from "@scopify/desktop-contract";
import { useI18n } from "@/store/module/i18n";
import type { McpRuntimeStatusProps } from "@/types/components/settings";
import { SettingRow } from "./SettingsUI";

function statusLabel(status: McpStatus | null, t: ReturnType<typeof useI18n>["t"]) {
  if (!status) return t("settings.mcp.status.unavailable");
  if (status.state === "error") return t("settings.mcp.status.error");
  return t(`settings.mcp.status.${status.state}`);
}

/** Displays the Main-process listener state and restarts only saved policy. */
export function McpRuntimeStatus({ isRestarting, onRestart, status }: McpRuntimeStatusProps) {
  const { t } = useI18n();
  const isListening = status?.state === "listening";
  const sublabel =
    status?.state === "error" ? status.error.message : t("settings.mcp.status.sublabel");

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
        label={t("settings.mcp.status.label")}
        sublabel={sublabel}
        control={
          <span
            aria-live="polite"
            className={`flex items-center gap-1.5 text-sm font-semibold ${
              isListening ? "text-success" : "text-muted-foreground"
            }`}
          >
            {status?.state === "error" ? (
              <CircleAlert className="size-4" />
            ) : isListening ? (
              <CircleCheck className="size-4" />
            ) : (
              <LoaderCircle
                className={status?.state === "starting" ? "size-4 animate-spin" : "size-4"}
              />
            )}
            {statusLabel(status, t)}
          </span>
        }
      />
      {isListening ? (
        <SettingRow
          label={t("settings.mcp.endpoint.label")}
          sublabel={t("settings.mcp.endpoint.sublabel")}
          isColumn
          control={
            <code className="block w-full rounded border border-input bg-surface-sunken px-3 py-2 text-left text-xs font-medium break-all text-foreground">
              {`http://127.0.0.1:${status.port}/mcp`}
            </code>
          }
        />
      ) : null}
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
