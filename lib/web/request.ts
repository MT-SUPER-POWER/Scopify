import axios, { type InternalAxiosRequestConfig } from "axios";

import { networkConfigOverrideSchema, type AppConfig } from "@/types/config";
import type { ScopifyRequestConfig } from "@/types/network";

import {
  WEB_BACKEND_SETTINGS_KEY,
  WEB_NETWORK_SETTINGS_KEY,
} from "@/hooks/settings/useSettingsState";
import { notifyExpiredMusicSession } from "@/lib/query/session";

import { ApiError, toApiError } from "./apiError";
import { appConfig, logger } from "./env";
import { reportFailure } from "./errorTracking";

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
  return networkConfigOverrideSchema.safeParse(parseJsonObject(value)).data ?? {};
}

function reportRequestError(error: ApiError) {
  reportFailure({
    context: {
      ...(error.config?.method ? { method: error.config.method } : {}),
      ...(error.config?.errorContext ? { requestContext: error.config.errorContext } : {}),
      ...(error.status === undefined ? {} : { status: error.status }),
      ...(error.config?.url ? { url: error.config.url } : {}),
    },
    error,
    event: "transport.request_failed",
    message: `API request failed: ${error.message}`,
    source: "transport",
  });
}

function createRequestTraceId() {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `request-${Date.now()}-${Math.random().toString(16).slice(2)}`
  );
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
  config.traceId ??= createRequestTraceId();
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
  const config = response.config as ScopifyRequestConfig;
  const hasUnexpectedBusinessCode =
    typeof responseData?.code === "number" &&
    config.expectedBusinessCodes !== undefined &&
    !config.expectedBusinessCodes.includes(responseData.code);

  if (responseData?.code === 250 || hasUnexpectedBusinessCode) {
    return Promise.reject(
      new ApiError({
        config,
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

request.interceptors.response.use(undefined, (error: unknown) => {
  const apiError = toApiError(error);
  const config = apiError.config;

  if (apiError.kind === "unauthenticated" && !isNoLoginRequest(config)) {
    notifyExpiredMusicSession();
  }

  reportRequestError(apiError);
  return Promise.reject(apiError);
});

export async function requestData<T>(config: ScopifyRequestConfig): Promise<T> {
  const response = await request.request<T>(config);
  return response.data;
}

export function requestConfig<D = unknown>(config: ScopifyRequestConfig<D>) {
  return config;
}

export default request;
