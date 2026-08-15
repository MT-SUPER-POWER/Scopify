"use client";

import { useEffect, useState } from "react";
import type { DesktopHostConfig, DiscordPresenceStatus } from "@scopify/desktop-contract";
import { toast } from "sonner";
import {
  getCachePreferences,
  getCacheStats,
  saveCachePreferences,
} from "@/lib/cache/cacheManagement";
import { translate } from "@/lib/i18n";
import { runtime } from "@/lib/runtime";
import { normalizeBackendConfig, resolveBackendBaseUrl } from "@/lib/web/backendUrl";
import { webConfig } from "@/lib/web/env";
import { pingBackend, probeBackend } from "@/lib/web/waitForBackend";
import { useI18nStore } from "@/store/module/i18n";
import type { WebConfig } from "@/types/config";
import type { BackendPingResult } from "@/types/network";
import type { SettingsConfig } from "@/types/settings";
import type { CachePreferences } from "@/types/cache";

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

function emitWebConfigUpdated(config: WebConfig) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("app-config-updated", { detail: config }));
}

export function useSettingsState() {
  const [config, setConfig] = useState<SettingsConfig | null>(null);
  const [originalConfig, setOriginalConfig] = useState<SettingsConfig | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPingingBackend, setIsPingingBackend] = useState(false);
  const [backendPingResult, setBackendPingResult] = useState<BackendPingResult | null>(null);
  const [isTestingDiscord, setIsTestingDiscord] = useState(false);
  const [discordStatus, setDiscordStatus] = useState<DiscordPresenceStatus | null>(null);
  const [cacheStats, setCacheStats] = useState<Awaited<ReturnType<typeof getCacheStats>> | null>(
    null,
  );
  const [cachePreferences, setCachePreferences] = useState<CachePreferences | null>(null);
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
    getCacheStats()
      .then(setCacheStats)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (runtime.isDesktop) return;

    getCachePreferences()
      .then(setCachePreferences)
      .catch((error: unknown) => {
        console.error("[Settings] failed to load cache preferences:", error);
      });
  }, []);

  useEffect(() => {
    if (!runtime.isDesktop) return;

    let isMounted = true;
    void runtime.discord
      .getStatus()
      .then((status) => {
        if (isMounted) setDiscordStatus(status);
      })
      .catch(() => {});

    const unsubscribe = runtime.discord.onStatusChanged((status) => {
      if (isMounted) setDiscordStatus(status);
    });
    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const handleWebChange = <S extends keyof WebConfig, K extends keyof WebConfig[S]>(
    section: S,
    key: K,
    value: WebConfig[S][K],
  ) => {
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
    try {
      const result = await probeBackend(backendUrl.url, timeout);
      setBackendPingResult(result);
      if (result.reachable) {
        toast.success(
          translate(
            config.web.app.locale,
            result.version
              ? "settings.backendPing.successWithVersion"
              : "settings.backendPing.success",
            result.version
              ? { latency: result.latencyMs, version: result.version }
              : { latency: result.latencyMs },
          ),
        );
        return;
      }

      const message =
        result.reason === "timeout"
          ? translate(config.web.app.locale, "settings.backendPing.timeout")
          : result.reason === "invalid-response"
            ? translate(config.web.app.locale, "settings.backendPing.invalidResponse")
            : result.reason === "server"
              ? translate(config.web.app.locale, "settings.backendPing.serverError", {
                  status: result.status ?? 0,
                })
              : translate(config.web.app.locale, "settings.backendPing.networkError");
      toast.error(message);
    } catch (error) {
      console.error("[Settings] failed to ping backend:", error);
      toast.error(translate(config.web.app.locale, "settings.backendPing.networkError"));
    } finally {
      setIsPingingBackend(false);
    }
  };

  const handleTestDiscord = async () => {
    if (!config?.desktop || isTestingDiscord) return;

    const locale = config.web.app.locale;
    const savedDiscordConfig = originalConfig?.desktop?.discord;
    const hasUnsavedDiscordChanges =
      !savedDiscordConfig ||
      JSON.stringify(config.desktop.discord) !== JSON.stringify(savedDiscordConfig);
    if (hasUnsavedDiscordChanges) {
      toast.warning(translate(locale, "settings.discord.test.saveFirst"));
      return;
    }

    setIsTestingDiscord(true);
    try {
      const status = await runtime.discord.testConnection();
      setDiscordStatus(status);
      if (status?.connected) {
        toast.success(translate(locale, "settings.discord.test.connected"));
      } else if (!status?.enabled) {
        toast.error(translate(locale, "settings.discord.test.disabled"));
      } else if (!status.configured) {
        toast.error(translate(locale, "settings.discord.test.applicationIdRequired"));
      } else {
        toast.error(
          translate(locale, "settings.discord.test.failed", {
            message: status.error || translate(locale, "settings.discord.test.unknownError"),
          }),
        );
      }
    } catch (error) {
      console.error("[Settings] failed to test Discord connection:", error);
      toast.error(
        translate(locale, "settings.discord.test.failed", {
          message:
            error instanceof Error && error.message
              ? error.message
              : translate(locale, "settings.discord.test.unknownError"),
        }),
      );
    } finally {
      setIsTestingDiscord(false);
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

  const handleCachePreferencesChange = (preferences: CachePreferences) => {
    if (runtime.isDesktop) {
      setConfig((current) =>
        current?.desktop
          ? {
              ...current,
              desktop: {
                ...current.desktop,
                cache: {
                  ...current.desktop.cache,
                  page: preferences.page,
                  playback: preferences.playback,
                },
              },
            }
          : current,
      );
      return;
    }

    setCachePreferences(preferences);
    void saveCachePreferences(preferences).catch((error: unknown) => {
      console.error("[Settings] failed to save cache preferences:", error);
      toast.error(translate(useI18nStore.getState().locale, "settings.saveFailed"));
      void getCachePreferences()
        .then(setCachePreferences)
        .catch(() => {});
    });
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
    requiresRestart,
    setIsModalOpen,
    handleWebChange,
    handleDesktopChange,
    handleConfirmSave,
    cacheStats,
    cachePreferences: config?.desktop
      ? { page: config.desktop.cache.page, playback: config.desktop.cache.playback }
      : cachePreferences,
    handleCachePreferencesChange,
    backendPingResult,
    isPingingBackend,
    handlePingBackend,
    discordStatus,
    isTestingDiscord,
    handleTestDiscord,
  };
}
