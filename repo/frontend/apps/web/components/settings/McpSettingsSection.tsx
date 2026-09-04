"use client";

import { SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { useMcpSettings } from "@/hooks/settings/useMcpSettings";
import { runtime } from "@/lib/runtime";
import { useI18n } from "@/store/module/i18n";
import type { McpSettingsSectionProps } from "@/types/components/settings";
import { McpCapabilitiesModal } from "./McpCapabilitiesModal";
import { McpCredentialControls } from "./McpCredentialControls";
import { McpRuntimeControls } from "./McpRuntimeControls";
import { SettingInput, SettingRow, SettingSection, Toggle } from "./SettingsUI";

/**
 * Controls the public local MCP policy and its deliberately limited runtime
 * operations. Credential text exists only after an explicit view/rotate action
 * and is never copied into the desktop YAML configuration.
 */
export function McpSettingsSection({
  config,
  onChange,
  statusRefreshKey,
}: McpSettingsSectionProps) {
  const { t } = useI18n();
  const [isCapabilitiesModalOpen, setIsCapabilitiesModalOpen] = useState(false);
  const {
    clientConfiguration,
    connectionTestResult,
    isRevealingCredential,
    isRestarting,
    isRotatingCredential,
    isTestingConnection,
    revealCredential,
    restart,
    rotateCredential,
    status,
    testConnection,
  } = useMcpSettings(statusRefreshKey);
  const isListening = status?.state === "listening";

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
      {/* 监听端口 */}
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
      {/* 受控能力与工具权限*/}
      <SettingRow
        label={t("settings.mcp.capabilities.manage.label")}
        sublabel={t("settings.mcp.capabilities.manage.sublabel")}
        control={
          <button
            type="button"
            onClick={() => setIsCapabilitiesModalOpen(true)}
            className="inline-flex items-center gap-2 rounded border border-input px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:border-content"
          >
            <SlidersHorizontal className="size-4" />
            {t("settings.mcp.capabilities.manage.button")}
          </button>
        }
      />
      {/* 测试 MCP 连接 */}
      <McpCapabilitiesModal
        capabilities={config.capabilities}
        onCapabilitiesChange={(capabilities) => onChange("mcp", "capabilities", capabilities)}
        onClose={() => setIsCapabilitiesModalOpen(false)}
        open={isCapabilitiesModalOpen}
      />
      {/* 重启服务 */}
      <McpRuntimeControls
        canTestConnection={isListening}
        connectionTestResult={connectionTestResult}
        isRestarting={isRestarting}
        isTestingConnection={isTestingConnection}
        onRestart={restart}
        onTestConnection={testConnection}
      />
      {/* 客户端凭据 */}
      <McpCredentialControls
        clientConfiguration={clientConfiguration}
        isRevealingCredential={isRevealingCredential}
        isRotatingCredential={isRotatingCredential}
        onRevealCredential={revealCredential}
        onRotateCredential={rotateCredential}
      />
    </SettingSection>
  );
}
