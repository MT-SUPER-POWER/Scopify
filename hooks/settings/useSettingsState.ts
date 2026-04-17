"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { translate } from "@/lib/i18n";
import { IS_ELECTRON } from "@/lib/utils";
import { appConfig } from "@/lib/web/env";
import { useI18nStore } from "@/store/module/i18n";
import type { AppConfig } from "@/types/config";

export const WEB_NETWORK_SETTINGS_KEY = "momo-web-network-settings";

function checkRequiresRestart(current: AppConfig, original: AppConfig): boolean {
  return (
    current.app.gpuAcceleration !== original.app.gpuAcceleration ||
    current.app.devTools !== original.app.devTools ||
    current.backend.host !== original.backend.host ||
    current.backend.port !== original.backend.port ||
    current.backend.autoStart !== original.backend.autoStart
  );
}

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
  const locale = useI18nStore.getState().locale;

  return {
    ...appConfig,
    app: {
      ...appConfig.app,
      locale,
    },
    network: {
      ...appConfig.network,
      ...networkOverride,
    },
  };
}

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

function emitAppConfigUpdated(config: AppConfig) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("app-config-updated", { detail: config }));
}

export function useSettingsState() {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [originalConfig, setOriginalConfig] = useState<AppConfig | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const _locale = useI18nStore((state) => state.locale);
  const setLocale = useI18nStore((state) => state.setLocale);

  useEffect(() => {
    if (!IS_ELECTRON) {
      const webConfig = buildWebConfig();
      setConfig(webConfig);
      setOriginalConfig(webConfig);
      return;
    }

    if (typeof window === "undefined" || !window.electronAPI) return;

    let isMounted = true;

    window.electronAPI
      .getAppConfig()
      .then((nextConfig: AppConfig) => {
        if (!isMounted) return;
        setConfig(nextConfig);
        setOriginalConfig(nextConfig);
      })
      .catch((error: unknown) => {
        console.error("[Settings] failed to load app config:", error);
        toast.error(translate(useI18nStore.getState().locale, "settings.loadFailed"));
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleLocalChange = <S extends keyof AppConfig, K extends keyof AppConfig[S]>(
    section: S,
    key: K,
    value: AppConfig[S][K],
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

    if (IS_ELECTRON && config.network.proxyMode === "custom" && !config.network.proxyUrl.trim()) {
      toast.error(translate(config.app.locale, "settings.proxyUrl.required"));
      return;
    }

    setIsSaving(true);

    try {
      if (!IS_ELECTRON) {
        localStorage.setItem(WEB_NETWORK_SETTINGS_KEY, JSON.stringify(config.network));
        setLocale(config.app.locale);
        emitAppConfigUpdated(config);
        setOriginalConfig(config);
        setConfig(config);
        setIsModalOpen(false);
        toast.success(translate(config.app.locale, "settings.saveSuccess"));
        return;
      }

      if (!window.electronAPI) return;

      const nextConfig = await window.electronAPI.updateAppConfig(config);
      setOriginalConfig(nextConfig);
      setConfig(nextConfig);
      setLocale(nextConfig.app.locale);
      emitAppConfigUpdated(nextConfig);
      setIsModalOpen(false);
      syncCloseActionPreference(nextConfig.app.closeAction);
      toast.success(translate(nextConfig.app.locale, "settings.saveSuccess"));

      if (originalConfig && checkRequiresRestart(nextConfig, originalConfig)) {
        window.electronAPI.relaunchApp();
      }
    } catch (error) {
      console.error("[Settings] failed to save app config:", error);
      toast.error(translate(config.app.locale, "settings.saveFailed"));
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges = Boolean(
    config && originalConfig && JSON.stringify(config) !== JSON.stringify(originalConfig),
  );
  const requiresRestart =
    IS_ELECTRON &&
    Boolean(config && originalConfig && checkRequiresRestart(config, originalConfig));

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
