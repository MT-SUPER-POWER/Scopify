"use client";

import { useEffect, useState } from "react";
import type { DesktopHostConfig } from "@scopify/desktop-contract";
import { toast } from "sonner";
import { clearPageCache } from "@/lib/cache/pageCache";
import { clearPlaybackCache, getPlaybackCacheStats } from "@/lib/cache/playbackCache";
import { translate } from "@/lib/i18n";
import { runtime } from "@/lib/runtime";
import { normalizeBackendConfig, resolveBackendBaseUrl } from "@/lib/web/backendUrl";
import { webConfig } from "@/lib/web/env";
import { pingBackend, probeBackend } from "@/lib/web/waitForBackend";
import { useI18nStore } from "@/store/module/i18n";
import type { WebConfig } from "@/types/config";
import type { BackendPingResult } from "@/types/network";
import type { SettingsConfig } from "@/types/settings";

export const WEB_NETWORK_SETTINGS_KEY = "momo-web-network-settings";
export const WEB_BACKEND_SETTINGS_KEY = "momo-web-backend-settings";

function checkRequiresRestart(current: DesktopHostConfig, original: DesktopHostConfig): boolean {
  return (
    current.app.gpuAcceleration !== original.app.gpuAcceleration ||
    current.app.devTools !== original.app.devTools ||
    current.frontend.host !== original.frontend.host ||
    current.frontend.devPort !== original.frontend.devPort
  );
}

function loadWebNetworkOverride(): Partial<WebConfig["network"]> | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = localStorage.getItem(WEB_NETWORK_SETTINGS_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function loadWebBackendOverride(): WebConfig["backend"] | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = localStorage.getItem(WEB_BACKEND_SETTINGS_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored) as Partial<WebConfig["backend"]>;
    const parsedPort =
      typeof parsed.port === "number" || typeof parsed.port === "string"
        ? Number(parsed.port)
        : Number.NaN;
    if (typeof parsed.host !== "string" || !Number.isFinite(parsedPort)) return null;
    const protocol =
      parsed.protocol === "https" || parsed.protocol === "http"
        ? parsed.protocol
        : webConfig.backend.protocol;
    const resolved = normalizeBackendConfig({
      ...webConfig.backend,
      host: parsed.host,
      port: parsedPort,
      protocol,
    });
    return resolved.ok ? resolved.backend : null;
  } catch {
    return null;
  }
}

function buildWebConfig(): WebConfig {
  return {
    app: { locale: useI18nStore.getState().locale },
    backend: {
      ...webConfig.backend,
      ...(loadWebBackendOverride() ?? {}),
    },
    network: {
      ...webConfig.network,
      ...(loadWebNetworkOverride() ?? {}),
    },
  };
}

function validateBackendConfig(locale: WebConfig["app"]["locale"], backend: WebConfig["backend"]) {
  if (!backend.host.trim()) {
    toast.error(translate(locale, "settings.backendHost.required"));
    return null;
  }

  if (!Number.isFinite(backend.port) || backend.port < 1 || backend.port > 65535) {
    toast.error(translate(locale, "settings.backendPort.invalid"));
    return null;
  }

  const resolved = normalizeBackendConfig(backend);
  if (!resolved.ok) {
    toast.error(translate(locale, "settings.backendInvalid", { message: resolved.message }));
    return null;
  }

  return resolved;
}

function syncCloseActionPreference(closeAction: DesktopHostConfig["app"]["closeAction"]) {
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

function emitWebConfigUpdated(config: WebConfig) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("app-config-updated", { detail: config }));
}

export function useSettingsState() {
  const [config, setConfig] = useState<SettingsConfig | null>(null);
  const [originalConfig, setOriginalConfig] = useState<SettingsConfig | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isClearingCache, setIsClearingCache] = useState(false);
  const [isClearingPlaybackCache, setIsClearingPlaybackCache] = useState(false);
  const [isPingingBackend, setIsPingingBackend] = useState(false);
  const [backendPingResult, setBackendPingResult] = useState<BackendPingResult | null>(null);
  const [playbackCacheStats, setPlaybackCacheStats] = useState<{
    entryCount: number;
    cacheDir: string | null;
  } | null>(null);
  const _locale = useI18nStore((state) => state.locale);
  const setLocale = useI18nStore((state) => state.setLocale);

  useEffect(() => {
    const currentWebConfig = buildWebConfig();
    if (!runtime.isDesktop) {
      const nextConfig = { desktop: null, web: currentWebConfig };
      setConfig(nextConfig);
      setOriginalConfig(nextConfig);
      return;
    }

    let isMounted = true;
    runtime.config
      .loadHostConfig()
      .then((desktopConfig) => {
        if (!isMounted || !desktopConfig) return;
        const nextConfig = { desktop: desktopConfig, web: currentWebConfig };
        setConfig(nextConfig);
        setOriginalConfig(nextConfig);
      })
      .catch((error: unknown) => {
        console.error("[Settings] failed to load Desktop host config:", error);
        toast.error(translate(useI18nStore.getState().locale, "settings.loadFailed"));
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    getPlaybackCacheStats()
      .then(setPlaybackCacheStats)
      .catch(() => {});
  }, []);

  const handleWebChange = <S extends keyof WebConfig, K extends keyof WebConfig[S]>(
    section: S,
    key: K,
    value: WebConfig[S][K],
  ) => {
    if (section === "backend" || section === "network") setBackendPingResult(null);
    setConfig((current) =>
      current
        ? {
            ...current,
            web: {
              ...current.web,
              [section]: { ...current.web[section], [key]: value },
            },
          }
        : current,
    );
  };

  const handlePingBackend = async () => {
    if (!config || isPingingBackend) return;

    const backendUrl = resolveBackendBaseUrl(config.web.backend);
    if (!backendUrl.ok) {
      toast.error(
        translate(config.web.app.locale, "settings.backendInvalid", {
          message: backendUrl.message,
        }),
      );
      return;
    }

    const timeout =
      Number.isFinite(config.web.network.timeout) && config.web.network.timeout > 0
        ? config.web.network.timeout
        : 10000;
    setIsPingingBackend(true);
    setBackendPingResult(null);
    try {
      setBackendPingResult(await probeBackend(backendUrl.url, timeout));
    } catch (error) {
      console.error("[Settings] failed to ping backend:", error);
      setBackendPingResult({
        latencyMs: 0,
        reachable: false,
        reason: "network",
        url: backendUrl.url,
      });
    } finally {
      setIsPingingBackend(false);
    }
  };

  const handleDesktopChange = <
    S extends keyof DesktopHostConfig,
    K extends keyof DesktopHostConfig[S],
  >(
    section: S,
    key: K,
    value: DesktopHostConfig[S][K],
  ) => {
    setConfig((current) =>
      current?.desktop
        ? {
            ...current,
            desktop: {
              ...current.desktop,
              [section]: { ...current.desktop[section], [key]: value },
            },
          }
        : current,
    );
  };

  const handleConfirmSave = async () => {
    if (!config) return;

    if (config.desktop?.network.proxyMode === "custom" && !config.desktop.network.proxyUrl.trim()) {
      toast.error(translate(config.web.app.locale, "settings.proxyUrl.required"));
      return;
    }

    const resolvedBackend = validateBackendConfig(config.web.app.locale, config.web.backend);
    if (!resolvedBackend) return;

    const nextWebConfig: WebConfig = {
      ...config.web,
      backend: resolvedBackend.backend,
    };

    setIsSaving(true);
    try {
      const savedDesktopConfig = config.desktop
        ? await runtime.config.saveHostConfig(config.desktop)
        : null;
      if (runtime.isDesktop && !savedDesktopConfig) return;

      localStorage.setItem(WEB_NETWORK_SETTINGS_KEY, JSON.stringify(nextWebConfig.network));
      localStorage.setItem(WEB_BACKEND_SETTINGS_KEY, JSON.stringify(nextWebConfig.backend));
      setLocale(nextWebConfig.app.locale);
      emitWebConfigUpdated(nextWebConfig);

      const nextConfig = { desktop: savedDesktopConfig, web: nextWebConfig };
      setOriginalConfig(nextConfig);
      setConfig(nextConfig);
      setIsModalOpen(false);
      if (savedDesktopConfig) syncCloseActionPreference(savedDesktopConfig.app.closeAction);
      toast.success(translate(nextWebConfig.app.locale, "settings.saveSuccess"));

      if (
        savedDesktopConfig &&
        originalConfig?.desktop &&
        checkRequiresRestart(savedDesktopConfig, originalConfig.desktop)
      ) {
        runtime.app.relaunch();
      }

      if (!(await pingBackend(resolvedBackend.url, nextWebConfig.network.timeout))) {
        toast.warning(
          translate(nextWebConfig.app.locale, "settings.backendUnreachable", {
            url: resolvedBackend.url,
          }),
          { duration: 8000 },
        );
      }
    } catch (error) {
      console.error("[Settings] failed to save config:", error);
      toast.error(translate(config.web.app.locale, "settings.saveFailed"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearCache = async () => {
    if (!config) return;
    setIsClearingCache(true);
    try {
      await clearPageCache();
      toast.success(translate(config.web.app.locale, "settings.cache.clearSuccess"));
    } catch (error) {
      console.error("[Settings] failed to clear cache:", error);
      toast.error(translate(config.web.app.locale, "settings.cache.clearFailed"));
    } finally {
      setIsClearingCache(false);
    }
  };

  const handleClearPlaybackCache = async () => {
    if (!config) return;
    setIsClearingPlaybackCache(true);
    try {
      await clearPlaybackCache();
      setPlaybackCacheStats({ entryCount: 0, cacheDir: playbackCacheStats?.cacheDir ?? null });
      toast.success(translate(config.web.app.locale, "settings.playbackCache.clearSuccess"));
    } catch (error) {
      console.error("[Settings] failed to clear playback cache:", error);
      toast.error(translate(config.web.app.locale, "settings.playbackCache.clearFailed"));
    } finally {
      setIsClearingPlaybackCache(false);
    }
  };

  const hasChanges = Boolean(
    config && originalConfig && JSON.stringify(config) !== JSON.stringify(originalConfig),
  );
  const requiresRestart = Boolean(
    config?.desktop &&
    originalConfig?.desktop &&
    checkRequiresRestart(config.desktop, originalConfig.desktop),
  );

  return {
    config,
    hasChanges,
    isModalOpen,
    isSaving,
    isClearingCache,
    requiresRestart,
    setIsModalOpen,
    handleWebChange,
    handleDesktopChange,
    handleConfirmSave,
    handleClearCache,
    isClearingPlaybackCache,
    playbackCacheStats,
    handleClearPlaybackCache,
    backendPingResult,
    isPingingBackend,
    handlePingBackend,
  };
}
