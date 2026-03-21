"use client";

import { useEffect, useState } from "react";
import { AppConfig } from "@/types/config";
import { IS_ELECTRON } from "@/lib/utils";
import { appConfig } from "@/lib/web/env";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ CONSTANTS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const WEB_NETWORK_SETTINGS_KEY = "momo-web-network-settings";

/**
 * 需要重启才能生效的设置路径（仅 Electron）
 */
function checkRequiresRestart(current: AppConfig, original: AppConfig): boolean {
  return (
    current.app.gpuAcceleration !== original.app.gpuAcceleration ||
    current.app.devTools !== original.app.devTools ||
    current.backend.host !== original.backend.host ||
    current.backend.port !== original.backend.port ||
    current.backend.autoStart !== original.backend.autoStart
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ WEB HELPERS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function loadWebNetworkOverride(): Partial<AppConfig["network"]> | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(WEB_NETWORK_SETTINGS_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function buildWebConfig(): AppConfig {
  const networkOverride = loadWebNetworkOverride();
  return {
    ...appConfig,
    network: { ...appConfig.network, ...networkOverride },
  };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ ELECTRON HELPERS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function syncCloseActionPreference(closeAction: AppConfig["app"]["closeAction"]) {
  if (typeof window === "undefined") return;
  if (closeAction === 0) {
    localStorage.setItem("app-close-action", "minimize");
    return;
  }
  if (closeAction === 1) {
    localStorage.setItem("app-close-action", "exit");
    return;
  }
  localStorage.removeItem("app-close-action");
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ HOOK ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function useSettingsState() {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [originalConfig, setOriginalConfig] = useState<AppConfig | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!IS_ELECTRON) {
      const webConfig = buildWebConfig();
      setConfig(webConfig);
      setOriginalConfig(webConfig);
      return;
    }

    if (typeof window === "undefined" || !window.electronAPI) return;

    let isMounted = true;

    window.electronAPI.getAppConfig()
      .then((cfg: AppConfig) => {
        if (!isMounted) return;
        setConfig(cfg);
        setOriginalConfig(cfg);
      })
      .catch((error: unknown) => {
        console.error("[Settings] 加载主进程配置失败:", error);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleLocalChange = <S extends keyof AppConfig, K extends keyof AppConfig[S]>(
    section: S,
    key: K,
    value: AppConfig[S][K]
  ) => {
    setConfig((currentConfig) => {
      if (!currentConfig) return currentConfig;
      return {
        ...currentConfig,
        [section]: {
          ...currentConfig[section],
          [key]: value,
        },
      };
    });
  };

  const handleConfirmSave = async () => {
    if (!config) return;
    setIsSaving(true);

    try {
      if (!IS_ELECTRON) {
        // Web: 仅持久化网络设置到 localStorage
        localStorage.setItem(WEB_NETWORK_SETTINGS_KEY, JSON.stringify(config.network));
        setOriginalConfig(config);
        setIsModalOpen(false);
        return;
      }

      if (!window.electronAPI) return;

      const updatedConfig = await window.electronAPI.updateAppConfig(config);
      const nextConfig = updatedConfig ?? await window.electronAPI.getAppConfig();

      if (!nextConfig) throw new Error("Failed to reload app config after saving.");

      setOriginalConfig(nextConfig);
      setConfig(nextConfig);
      setIsModalOpen(false);
      syncCloseActionPreference(nextConfig.app.closeAction);

      // 如果需要重启，自动重启应用
      if (checkRequiresRestart(nextConfig, originalConfig!)) {
        window.electronAPI.relaunchApp();
      }
    } catch (error) {
      console.error("[Settings] 配置写入失败:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges = Boolean(
    config && originalConfig && JSON.stringify(config) !== JSON.stringify(originalConfig)
  );

  const requiresRestart = IS_ELECTRON && Boolean(
    config && originalConfig && checkRequiresRestart(config, originalConfig)
  );

  return {
    config,
    hasChanges,
    isModalOpen,
    isSaving,
    requiresRestart,
    setIsModalOpen,
    handleLocalChange,
    handleConfirmSave,
  };
}
