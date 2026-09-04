"use client";

import { Copy, KeyRound, LoaderCircle } from "lucide-react";

import { useI18n } from "@/store/module/i18n";
import type { McpClientConfigurationPreviewProps } from "@/types/components/settings";

/** Small syntax-rendered JSON preview for the current valid MCP credential. */
export function McpClientConfigurationPreview({
  configuration,
  isRotating = false,
  onCopy,
  onRotate,
}: McpClientConfigurationPreviewProps) {
  const { t } = useI18n();

  // 兼顾标准 mcpServers.scopify 结构与旧版扁平结构（如 Electron Main 进程尚未重启时），防止 undefined 崩溃
  const legacyConfig = configuration as unknown as {
    headers?: { Authorization?: string };
    type?: string;
    url?: string;
  };

  const server =
    configuration?.mcpServers?.scopify ??
    (legacyConfig?.url
      ? {
          headers: { Authorization: legacyConfig.headers?.Authorization ?? "" },
          type: "http" as const,
          url: legacyConfig.url,
        }
      : null);

  if (!server) return null;

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-semibold text-foreground">
          {t("settings.mcp.credential.previewTitle")}
        </p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          {t("settings.mcp.credential.revealedWarning")}
        </p>
      </div>
      <pre
        aria-label={t("settings.mcp.credential.previewTitle")}
        className="max-h-64 overflow-auto rounded-md border border-input bg-surface-sunken p-3 text-left font-mono text-xs leading-5 break-all whitespace-pre-wrap"
      >
        <span className="text-content">{"{\n  "}</span>
        <span className="text-info">&quot;mcpServers&quot;</span>
        <span className="text-content">{": {\n    "}</span>
        <span className="text-info">&quot;scopify&quot;</span>
        <span className="text-content">{": {\n      "}</span>
        <span className="text-info">&quot;type&quot;</span>
        <span className="text-content">{": "}</span>
        <span className="text-success">&quot;{server.type}&quot;</span>
        <span className="text-content">{",\n      "}</span>
        <span className="text-info">&quot;url&quot;</span>
        <span className="text-content">{": "}</span>
        <span className="text-success">&quot;{server.url}&quot;</span>
        <span className="text-content">{",\n      "}</span>
        <span className="text-info">&quot;headers&quot;</span>
        <span className="text-content">{": {\n        "}</span>
        <span className="text-info">&quot;Authorization&quot;</span>
        <span className="text-content">{": "}</span>
        <span className="text-warning">&quot;{server.headers.Authorization}&quot;</span>
        <span className="text-content">{"\n      }\n    }\n  }\n}"}</span>
      </pre>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => void onCopy()}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded border border-input bg-surface-raised px-3 py-2 text-sm font-medium text-foreground transition-colors hover:border-content"
        >
          <Copy className="size-4" />
          {t("settings.mcp.credential.copy")}
        </button>
        {onRotate ? (
          <button
            type="button"
            disabled={isRotating}
            onClick={() => void onRotate()}
            className="inline-flex items-center justify-center gap-2 rounded border border-input px-3 py-2 text-sm font-medium text-foreground transition-colors hover:border-content hover:bg-surface-raised disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isRotating ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <KeyRound className="size-4" />
            )}
            {t("settings.mcp.credential.rotate")}
          </button>
        ) : null}
      </div>
    </div>
  );
}
