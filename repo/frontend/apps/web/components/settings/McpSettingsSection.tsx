"use client";

import type { McpCapability } from "@scopify/desktop-contract";
import { useMcpSettings } from "@/hooks/settings/useMcpSettings";
import { runtime } from "@/lib/runtime";
import { useI18n } from "@/store/module/i18n";
import type { McpSettingsSectionProps } from "@/types/components/settings";
import { McpCredentialControls } from "./McpCredentialControls";
import { McpRuntimeStatus } from "./McpRuntimeStatus";
import { SettingInput, SettingRow, SettingSection, Toggle } from "./SettingsUI";

function updateCapability(
  capabilities: McpCapability[],
  capability: McpCapability,
): McpCapability[] {
  return capabilities.includes(capability)
    ? capabilities.filter((value) => value !== capability)
    : [...capabilities, capability];
}

/**
 * Controls the public local MCP policy and its deliberately limited runtime
 * operations. Credential text exists only after an explicit rotate action and
 * is never copied into the desktop YAML configuration.
 */
export function McpSettingsSection({
  config,
  onChange,
  statusRefreshKey,
}: McpSettingsSectionProps) {
  const { t } = useI18n();
  const {
    clientConfiguration,
    isRestarting,
    isRotatingCredential,
    restart,
    rotateCredential,
    status,
  } = useMcpSettings(statusRefreshKey);
  const isListening = status?.state === "listening";

  const toggleCapability = (capability: McpCapability) => {
    onChange("mcp", "capabilities", updateCapability(config.capabilities, capability));
  };

  if (!runtime.isDesktop) return null;

  return (
    <SettingSection title={t("settings.section.mcp")}>
      <SettingRow
        label={t("settings.mcp.enabled.label")}
        sublabel={t("settings.mcp.enabled.sublabel")}
        control={
          <Toggle
            enabled={config.enabled}
            onChange={() => onChange("mcp", "enabled", !config.enabled)}
          />
        }
      />
      <SettingRow
        label={t("settings.mcp.port.label")}
        sublabel={t("settings.mcp.port.sublabel")}
        control={
          <SettingInput
            type="number"
            value={config.port}
            onChange={(value) => onChange("mcp", "port", Number(value))}
          />
        }
      />
      <SettingRow
        label={t("settings.mcp.read.label")}
        sublabel={t("settings.mcp.read.sublabel")}
        control={
          <Toggle
            enabled={config.capabilities.includes("playback.read")}
            onChange={() => toggleCapability("playback.read")}
          />
        }
      />
      <SettingRow
        label={t("settings.mcp.control.label")}
        sublabel={t("settings.mcp.control.sublabel")}
        control={
          <Toggle
            enabled={config.capabilities.includes("playback.control")}
            onChange={() => toggleCapability("playback.control")}
          />
        }
      />
      <McpRuntimeStatus isRestarting={isRestarting} onRestart={restart} status={status} />
      <McpCredentialControls
        clientConfiguration={clientConfiguration}
        isListening={isListening}
        isRotatingCredential={isRotatingCredential}
        onRotateCredential={rotateCredential}
      />
    </SettingSection>
  );
}
