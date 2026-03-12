"use client";

import { useEffect, useState } from "react";
import { AppConfig } from "@/types/config";

function syncCloseActionPreference(closeAction: AppConfig["app"]["closeAction"]) {
  if (typeof window === "undefined") {
    return;
  }

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

export function useSettingsState() {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [originalConfig, setOriginalConfig] = useState<AppConfig | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.electronAPI) {
      return;
    }

    let isMounted = true;

    window.electronAPI.getAppConfig()
      .then((cfg: AppConfig) => {
        if (!isMounted) return;

        setConfig(cfg);
        setOriginalConfig(cfg);
      })
      .catch((error) => {
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
      if (!currentConfig) {
        return currentConfig;
      }

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
    if (!config || !window.electronAPI) {
      return;
    }

    setIsSaving(true);

    try {
      const updatedConfig = await window.electronAPI.updateAppConfig(config);
      const nextConfig = updatedConfig ?? await window.electronAPI.getAppConfig();

      if (!nextConfig) {
        throw new Error("Failed to reload app config after saving.");
      }

      setOriginalConfig(nextConfig);
      setConfig(nextConfig);
      setIsModalOpen(false);
      syncCloseActionPreference(nextConfig.app.closeAction);
    } catch (error) {
      console.error("[Settings] YAML 配置写入失败:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges = Boolean(
    config && originalConfig && JSON.stringify(config) !== JSON.stringify(originalConfig)
  );

  return {
    config,
    hasChanges,
    isModalOpen,
    isSaving,
    setIsModalOpen,
    handleLocalChange,
    handleConfirmSave,
  };
}
