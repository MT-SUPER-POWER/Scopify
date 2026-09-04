"use client";

import { Copy, KeyRound, LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/store/module/i18n";
import type { McpCredentialControlsProps } from "@/types/components/settings";
import { SettingRow } from "./SettingsUI";

/**
 * The configuration text includes a token, so it is kept only in React memory
 * after a user-initiated rotation and is never saved in the host config.
 */
export function McpCredentialControls({
  clientConfiguration,
  isListening,
  isRotatingCredential,
  onRotateCredential,
}: McpCredentialControlsProps) {
  const { t } = useI18n();
  const configurationText = clientConfiguration
    ? JSON.stringify(clientConfiguration, null, 2)
    : null;

  const handleRotateCredential = async () => {
    try {
      const nextConfiguration = await onRotateCredential();
      if (!nextConfiguration) {
        toast.error(t("settings.mcp.credential.failed"));
        return;
      }
      toast.success(t("settings.mcp.credential.rotated"));
    } catch {
      toast.error(t("settings.mcp.credential.failed"));
    }
  };

  const handleCopy = async () => {
    if (!configurationText || !navigator.clipboard) {
      toast.error(t("settings.mcp.credential.copyFailed"));
      return;
    }

    try {
      await navigator.clipboard.writeText(configurationText);
      toast.success(t("settings.mcp.credential.copied"));
    } catch {
      toast.error(t("settings.mcp.credential.copyFailed"));
    }
  };

  return (
    <SettingRow
      label={t("settings.mcp.credential.label")}
      sublabel={t("settings.mcp.credential.sublabel")}
      isColumn={Boolean(configurationText)}
      control={
        <div className="w-full space-y-3">
          <button
            type="button"
            disabled={!isListening || isRotatingCredential}
            onClick={() => void handleRotateCredential()}
            className="inline-flex items-center gap-2 rounded border border-input px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:border-content disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isRotatingCredential ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <KeyRound className="size-4" />
            )}
            {t("settings.mcp.credential.rotate")}
          </button>
          {configurationText ? (
            <div className="space-y-2 rounded border border-warning/40 bg-warning/10 p-3">
              <p className="text-sm leading-relaxed text-foreground">
                {t("settings.mcp.credential.revealedWarning")}
              </p>
              <pre className="max-h-52 overflow-auto rounded bg-surface-sunken p-3 text-left text-xs break-all whitespace-pre-wrap text-foreground">
                {configurationText}
              </pre>
              <button
                type="button"
                onClick={() => void handleCopy()}
                className="inline-flex items-center gap-2 rounded border border-input bg-surface-raised px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:border-content"
              >
                <Copy className="size-4" />
                {t("settings.mcp.credential.copy")}
              </button>
            </div>
          ) : null}
        </div>
      }
    />
  );
}
