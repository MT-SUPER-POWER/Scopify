"use client";

import { useEffect, useState } from "react";
import type { DesktopHostConfig, DiscordPresenceStatus } from "@scopify/desktop-contract";
import { toast } from "sonner";
import {
  getCachePreferences,
  getCacheStats,
  saveCachePreferences,
} from "@/lib/cache/cacheManagement";
import { useDesktopBackendStatus } from "@/hooks/backend/useDesktopBackendStatus";
import { translate } from "@/lib/i18n";
import { runtime } from "@/lib/runtime";
import { buildSavedSettingsConfig } from "@/lib/settings/buildSavedSettingsConfig";
import {
  cleanBackendHostInput,
  isValidBackendHost,
  normalizeBackendConfig,
} from "@/lib/web/backendUrl";
import { webConfig } from "@/lib/web/env";
import {
  loadStoredBackendAddress,
  loadStoredNeteaseConfig,
  loadStoredNetworkConfig,
  saveStoredRequestSettings,
} from "@/lib/web/http/storedSettings";
import { pingBackend, probeBackend, probeQqBackend } from "@/lib/web/waitForBackend";
import { useI18nStore } from "@/store/module/i18n";
import type { BackendAddress, BackendPlatform, WebConfig } from "@/types/settings/config";
import type { BackendPingResult } from "@/types/network/model";
import type { SettingsConfig } from "@/types/settings/model";
import type { CachePreferences } from "@/types/cache/model";

function checkRequiresRestart(current: DesktopHostConfig, original: DesktopHostConfig): boolean {
  return (
    current.app.gpuAcceleration !== original.app.gpuAcceleration ||
    current.frontend.host !== original.frontend.host ||
    current.frontend.devPort !== original.frontend.devPort
  );
}

function buildWebConfig(): WebConfig {
  return {
    app: { locale: useI18nStore.getState().locale },
    backend: {
      netease: {
        ...webConfig.backend.netease,
        ...(loadStoredBackendAddress("netease") ?? {}),
      },
      qq: {
        ...webConfig.backend.qq,
        ...(loadStoredBackendAddress("qq") ?? {}),
      },
    },
    network: {
      ...webConfig.network,
      ...loadStoredNetworkConfig(),
    },
    netease: {
      ...webConfig.netease,
      ...loadStoredNeteaseConfig(),
    },
  };
}

function validateBackendConfig(locale: WebConfig["app"]["locale"], backend: BackendAddress) {
  if (!backend.host.trim()) {
    toast.error(translate(locale, "settings.backendHost.required"));
    return null;
  }

  const cleaned = cleanBackendHostInput(backend.host);
  if (!isValidBackendHost(cleaned.host)) {
    toast.error(translate(locale, "settings.backendHost.invalid"));
    return null;
  }

  const port = cleaned.port ?? backend.port;
  if (!Number.isFinite(port) || port < 1 || port > 65535) {
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
  const [pingingBackends, setPingingBackends] = useState<Record<BackendPlatform, boolean>>({
    netease: false,
    qq: false,
  });
  const [backendPingResults, setBackendPingResults] = useState<
    Record<BackendPlatform, BackendPingResult | null>
  >({ netease: null, qq: null });
  const [isTestingDiscord, setIsTestingDiscord] = useState(false);
  const [discordStatus, setDiscordStatus] = useState<DiscordPresenceStatus | null>(null);
  const [mcpStatusRefreshKey, setMcpStatusRefreshKey] = useState(0);
  const neteaseBackendStatus = useDesktopBackendStatus(runtime.backend);
  const qqBackendStatus = useDesktopBackendStatus(runtime.qqBackend);
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

  const updateBackendAddress = (
    platform: BackendPlatform,
    update: (address: BackendAddress) => BackendAddress,
  ) => {
    setConfig((current) =>
      current
        ? {
            ...current,
            web: {
              ...current.web,
              backend: {
                ...current.web.backend,
                [platform]: update(current.web.backend[platform]),
              },
            },
          }
        : current,
    );
  };

  const handleBackendAddressChange = <K extends keyof BackendAddress>(
    platform: BackendPlatform,
    key: K,
    value: BackendAddress[K],
  ) => {
    updateBackendAddress(platform, (address) => {
      if (key !== "protocol") return { ...address, [key]: value };
      // Follow the protocol's default port when the address still uses the other default.
      let port = address.port;
      if (value === "https" && port === 80) port = 443;
      if (value === "http" && port === 443) port = 80;
      return { ...address, protocol: value as BackendAddress["protocol"], port };
    });
  };

  const handleBackendHostBlur = (platform: BackendPlatform) => {
    updateBackendAddress(platform, (address) => {
      const rawHost = address.host;
      if (!rawHost.trim()) return address;

      const cleaned = cleanBackendHostInput(rawHost);
      return {
        ...address,
        host: cleaned.host || rawHost.trim(),
        ...(cleaned.protocol ? { protocol: cleaned.protocol } : {}),
        ...(cleaned.port !== undefined ? { port: cleaned.port } : {}),
      };
    });
  };

  const handlePingBackend = async (platform: BackendPlatform) => {
    if (!config || pingingBackends[platform]) return;
    const setPinging = (isPinging: boolean) =>
      setPingingBackends((current) => ({ ...current, [platform]: isPinging }));
    const setPingResult = (result: BackendPingResult) =>
      setBackendPingResults((current) => ({ ...current, [platform]: result }));

    const validated = validateBackendConfig(config.web.app.locale, config.web.backend[platform]);
    if (!validated) return;

    updateBackendAddress(platform, () => validated.backend);

    const timeout =
      Number.isFinite(config.web.network.timeout) && config.web.network.timeout > 0
        ? config.web.network.timeout
        : 10000;
    setPinging(true);
    try {
      const probe = platform === "qq" ? probeQqBackend : probeBackend;
      const result = await probe(validated.url, timeout);
      setPingResult(result);
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
      } else {
        toast.error(
          result.reason === "timeout"
            ? translate(config.web.app.locale, "settings.backendPing.timeout")
            : result.reason === "invalid-response"
              ? translate(config.web.app.locale, "settings.backendPing.invalidResponse")
              : result.reason === "server"
                ? translate(config.web.app.locale, "settings.backendPing.serverError", {
                    status: result.status ?? 0,
                  })
                : translate(config.web.app.locale, "settings.backendPing.networkError"),
        );
      }
    } catch {
      setPingResult({
        latencyMs: 0,
        reachable: false,
        reason: "network",
        url: validated.url,
      });
      toast.error(translate(config.web.app.locale, "settings.backendPing.networkError"));
    } finally {
      setPinging(false);
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

    const resolvedBackend = validateBackendConfig(
      config.web.app.locale,
      config.web.backend.netease,
    );
    if (!resolvedBackend) return;
    const resolvedQqBackend = validateBackendConfig(config.web.app.locale, config.web.backend.qq);
    if (!resolvedQqBackend) return;

    const nextWebConfig = buildSavedSettingsConfig(config, {
      netease: resolvedBackend.backend,
      qq: resolvedQqBackend.backend,
    }).web;

    setIsSaving(true);
    try {
      const savedDesktopConfig = config.desktop
        ? await runtime.config.saveHostConfig(config.desktop)
        : null;
      if (runtime.isDesktop && !savedDesktopConfig) return;

      saveStoredRequestSettings(nextWebConfig);
      setLocale(nextWebConfig.app.locale);
      emitWebConfigUpdated(nextWebConfig);

      const nextConfig = { desktop: savedDesktopConfig, web: nextWebConfig };
      setOriginalConfig(nextConfig);
      setConfig(nextConfig);
      // Main reconciles MCP while saving host settings. Re-read its actual
      // status so the UI reports a port conflict rather than the stale state.
      if (runtime.isDesktop) setMcpStatusRefreshKey((current) => current + 1);
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

  const handleDiscardChanges = () => {
    if (originalConfig) {
      setConfig(originalConfig);
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
    handleDiscardChanges,
    cacheStats,
    cachePreferences: config?.desktop
      ? { page: config.desktop.cache.page, playback: config.desktop.cache.playback }
      : cachePreferences,
    handleCachePreferencesChange,
    backendStatuses: { netease: neteaseBackendStatus, qq: qqBackendStatus },
    backendPingResults,
    pingingBackends,
    handleBackendAddressChange,
    handleBackendHostBlur,
    handlePingBackend,
    discordStatus,
    isTestingDiscord,
    handleTestDiscord,
    mcpStatusRefreshKey,
  };
}
