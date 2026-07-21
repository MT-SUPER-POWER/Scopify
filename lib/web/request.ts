import axios, { type InternalAxiosRequestConfig } from "axios";

import type { AppConfig } from "@/types/config";
import type { ScopifyRequestConfig } from "@/types/network";

import {
  WEB_BACKEND_SETTINGS_KEY,
  WEB_NETWORK_SETTINGS_KEY,
} from "@/hooks/settings/useSettingsState";
import { notifyExpiredMusicSession } from "@/lib/query/session";

import { ApiError, toApiError } from "./apiError";
import { appConfig, logger } from "./env";

function buildBackendBaseUrl(config: Pick<AppConfig, "backend">) {
  return `http://${config.backend.host}:${config.backend.port}`;
}

function loadInitialBackendConfig(): AppConfig["backend"] {
  if (typeof window === "undefined") return appConfig.backend;

  try {
    const stored = localStorage.getItem(WEB_BACKEND_SETTINGS_KEY);
    if (!stored) return appConfig.backend;
    const parsed = parseJsonObject(stored);
    if (typeof parsed.host === "string" && typeof parsed.port === "number") {
      return { host: parsed.host, port: parsed.port };
    }
  } catch {
    // Ignore malformed local cache.
  }

  return appConfig.backend;
}

const INITIAL_BACKEND_CONFIG = loadInitialBackendConfig();
const NO_RETRY_URLS: string[] = [];

let baseURL = buildBackendBaseUrl({ backend: INITIAL_BACKEND_CONFIG });
let runtimeNetworkConfig: AppConfig["network"] = { ...appConfig.network };
let runtimeBackendConfig: AppConfig["backend"] = { ...INITIAL_BACKEND_CONFIG };

export function getBackendBaseUrl() {
  return buildBackendBaseUrl({ backend: runtimeBackendConfig });
}

function applyRuntimeConfig(config: Pick<AppConfig, "backend" | "network">) {
  runtimeNetworkConfig = { ...config.network };
  runtimeBackendConfig = { ...config.backend };
  baseURL = buildBackendBaseUrl({ backend: runtimeBackendConfig });
  request.defaults.baseURL = baseURL;
}

function getNetworkConfig(): AppConfig["network"] {
  if (typeof window === "undefined" || isElectronRuntime()) return runtimeNetworkConfig;

  try {
    const stored = localStorage.getItem(WEB_NETWORK_SETTINGS_KEY);
    if (stored) {
      return { ...runtimeNetworkConfig, ...parseStoredNetworkConfig(stored) };
    }
  } catch {
    // Ignore malformed local cache.
  }

  return runtimeNetworkConfig;
}

function isElectronRuntime() {
  return typeof window !== "undefined" && !!window.electronAPI;
}

function isNoLoginRequest(config?: ScopifyRequestConfig) {
  const params = config?.params as unknown;
  return isRecord(params) && params.noLogin === true;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseJsonObject(value: string): Record<string, unknown> {
  const parsed = JSON.parse(value) as unknown;
  return isRecord(parsed) ? parsed : {};
}

function parseStoredNetworkConfig(value: string): Partial<AppConfig["network"]> {
  const parsed = parseJsonObject(value);
  return {
    ...(typeof parsed.max_retries === "number" ? { max_retries: parsed.max_retries } : {}),
    ...(typeof parsed.proxyMode === "string" ? { proxyMode: parsed.proxyMode } : {}),
    ...(typeof parsed.proxyUrl === "string" ? { proxyUrl: parsed.proxyUrl } : {}),
    ...(typeof parsed.randomCNIP === "string" ? { randomCNIP: parsed.randomCNIP } : {}),
    ...(typeof parsed.retry_delay === "number" ? { retry_delay: parsed.retry_delay } : {}),
    ...(typeof parsed.timeout === "number" ? { timeout: parsed.timeout } : {}),
  } as Partial<AppConfig["network"]>;
}

async function reportLegacyRequestError(error: ApiError) {
  if (error.data) {
    console.error(`[API ${error.status ?? "UNKNOWN"}] ${error.message}`, {
      data: error.data,
      method: error.config?.method,
      status: error.status,
      url: error.config?.url,
    });

    if (typeof window !== "undefined") {
      const { translate } = await import("@/lib/i18n");
      const { useI18nStore } = await import("@/store/module/i18n");
      const { toast } = await import("sonner");
      toast.error(
        translate(useI18nStore.getState().locale, "common.message.operationFailedWithReason", {
          message: error.message,
        }),
      );
    }
    return;
  }

  console.error(`[API ${error.status ?? "UNKNOWN"}] Network or Server Error`, error);
}

const request = axios.create({
  baseURL,
  timeout: getNetworkConfig().timeout,
  withCredentials: true,
});

logger.info("--------------------------------------------------");
logger.info("Next.js Request Backend URL is", baseURL);
logger.info("--------------------------------------------------");

if (typeof window !== "undefined" && window.electronAPI?.getAppConfig) {
  const syncRuntimeConfig = async () => {
    try {
      const runtimeConfig = await window.electronAPI?.getAppConfig();
      if (runtimeConfig) {
        applyRuntimeConfig(runtimeConfig);
        logger.info("Overrode runtime app config from Electron:", runtimeConfig);
      }
    } catch (error) {
      logger.warn("Failed to read runtime appConfig from Electron preload", error);
    }
  };

  void syncRuntimeConfig();

  window.addEventListener("app-config-updated", (event) => {
    const nextConfig = (event as CustomEvent<AppConfig>).detail;
    if (nextConfig) applyRuntimeConfig(nextConfig);
  });
}

request.interceptors.request.use((config: InternalAxiosRequestConfig & ScopifyRequestConfig) => {
  if (!baseURL) throw new Error("BACKEND_URL is not configured.");

  const networkConfig = getNetworkConfig();
  config.baseURL = baseURL;
  config.timeout = networkConfig.timeout;
  config.retryCount ??= 0;
  const requestParams = isRecord(config.params) ? config.params : {};
  config.params = {
    ...requestParams,
    timestamp: Date.now(),
    ...(isElectronRuntime() ? { os: "pc" } : { platform: "web" }),
    randomCNIP: networkConfig.randomCNIP,
    ...(isElectronRuntime() && networkConfig.proxyMode === "custom" && networkConfig.proxyUrl
      ? { proxy: networkConfig.proxyUrl }
      : {}),
  };

  return config;
});

request.interceptors.response.use((response) => {
  const responseData = response.data as null | { code?: unknown; message?: unknown; msg?: unknown };
  if (responseData?.code === 250) {
    return Promise.reject(
      new ApiError({
        config: response.config as ScopifyRequestConfig,
        data: response.data,
        kind: "business",
        message:
          (typeof responseData.msg === "string" && responseData.msg) ||
          (typeof responseData.message === "string" && responseData.message) ||
          "Business request failed",
        status: response.status,
      }),
    );
  }

  return response;
});

request.interceptors.response.use(undefined, async (error: unknown) => {
  const apiError = toApiError(error);
  const config = apiError.config;

  if (apiError.kind === "unauthenticated" && !isNoLoginRequest(config)) {
    if (config) config.noRetry = true;
    notifyExpiredMusicSession();
  }

  if (!config?.suppressErrorToast) {
    await reportLegacyRequestError(apiError);
  }

  const { max_retries, retry_delay } = getNetworkConfig();
  const shouldRetry =
    config?.retryCount !== undefined &&
    config.retryCount < max_retries &&
    !NO_RETRY_URLS.includes(config.url ?? "") &&
    !config.noRetry;

  if (shouldRetry) {
    config.retryCount = (config.retryCount ?? 0) + 1;
    logger.warn(`Request retrying: ${config.retryCount}/${max_retries}`);
    await new Promise((resolve) => setTimeout(resolve, retry_delay));
    return request(config);
  }

  return Promise.reject(apiError);
});

export async function requestData<T>(config: ScopifyRequestConfig): Promise<T> {
  const queryRequestConfig: ScopifyRequestConfig = {
    ...config,
    noRetry: true,
    suppressErrorToast: true,
  };
  const response = await request.request<T>(queryRequestConfig);
  return response.data;
}

export default request;
