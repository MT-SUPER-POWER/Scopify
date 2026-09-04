"use client";

import { Braces, LoaderCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import { useI18n } from "@/store/module/i18n";
import type { McpCredentialControlsProps } from "@/types/components/settings";
import { McpClientConfigurationPreview } from "./McpClientConfigurationPreview";
import { SettingRow } from "./SettingsUI";

/**
 * MCP 客户端凭据管理控件
 *
 * 凭据由 Electron safeStorage 加密保存在系统安全存储中，不会暴露给普通配置文件。
 * 外部采用单按钮入口（“查看配置”），避免双按钮挤占行内空间；
 * “重新生成凭据”收敛在配置悬浮面板内部，与“复制客户端配置”协同操作。
 */
export function McpCredentialControls({
  clientConfiguration,
  isRevealingCredential,
  isRotatingCredential,
  onRevealCredential,
  onRotateCredential,
}: McpCredentialControlsProps) {
  const { t } = useI18n();
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  /** 打开或关闭配置预览；未获取配置时先读取当前有效凭据 */
  const handleTogglePreview = async () => {
    if (isPreviewOpen) {
      setIsPreviewOpen(false);
      return;
    }
    if (clientConfiguration) {
      setIsPreviewOpen(true);
      return;
    }
    try {
      const configuration = await onRevealCredential();
      if (!configuration) throw new Error("credential-unavailable");
      setIsPreviewOpen(true);
    } catch {
      toast.error(t("settings.mcp.credential.revealFailed"));
    }
  };

  /** 在悬浮面板内部生成并轮换新 Token；旧凭据立即失效，外部客户端必须同步更新 */
  const rotate = async () => {
    try {
      const configuration = await onRotateCredential();
      if (!configuration) throw new Error("credential-unavailable");
      toast.success(t("settings.mcp.credential.rotated"));
    } catch {
      toast.error(t("settings.mcp.credential.failed"));
    }
  };

  const copy = async () => {
    if (!clientConfiguration || !navigator.clipboard) {
      toast.error(t("settings.mcp.credential.copyFailed"));
      return;
    }
    try {
      // 统一规格化为标准 mcpServers 结构，确保复制到剪贴板的内容直接可用于 Cursor / Claude
      const legacy = clientConfiguration as unknown as {
        headers?: { Authorization?: string };
        url?: string;
      };
      const payload =
        clientConfiguration.mcpServers?.scopify != null
          ? clientConfiguration
          : legacy?.url
            ? {
                mcpServers: {
                  scopify: {
                    headers: { Authorization: legacy.headers?.Authorization ?? "" },
                    type: "http" as const,
                    url: legacy.url,
                  },
                },
              }
            : clientConfiguration;

      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      toast.success(t("settings.mcp.credential.copied"));
    } catch {
      toast.error(t("settings.mcp.credential.copyFailed"));
    }
  };

  return (
    <SettingRow
      label={t("settings.mcp.credential.label")}
      sublabel={t("settings.mcp.credential.sublabel")}
      control={
        <Popover
          open={isPreviewOpen && Boolean(clientConfiguration)}
          onOpenChange={setIsPreviewOpen}
        >
          <PopoverAnchor asChild>
            <button
              type="button"
              disabled={isRevealingCredential}
              onClick={() => void handleTogglePreview()}
              className="inline-flex items-center gap-2 rounded border border-input px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:border-content disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isRevealingCredential ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <Braces className="size-4" />
              )}
              {t("settings.mcp.credential.reveal")}
            </button>
          </PopoverAnchor>
          {clientConfiguration ? (
            <PopoverContent align="end" sideOffset={8} className="w-[min(28rem,calc(100vw-2rem))]">
              <McpClientConfigurationPreview
                configuration={clientConfiguration}
                isRotating={isRotatingCredential}
                onCopy={copy}
                onRotate={rotate}
              />
            </PopoverContent>
          ) : null}
        </Popover>
      }
    />
  );
}
