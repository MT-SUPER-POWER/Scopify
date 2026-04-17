import axios, { type InternalAxiosRequestConfig } from "axios";

import { WEB_NETWORK_SETTINGS_KEY } from "@/hooks/settings/useSettingsState";
import { usePlayerStore, useUserStore } from "@/store";
import type { AppConfig } from "@/types/config";
import { appConfig, logger } from "./env";

interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  retryCount?: number;
  noRetry?: boolean;
  randomCNIP?: boolean;
}

const INITIAL_BASE_URL = `http://${appConfig.backend.host}:${appConfig.backend.port}`;
const NO_RETRY_URLS: string[] = [];

let baseURL = INITIAL_BASE_URL;
let runtimeNetworkConfig: AppConfig["network"] = { ...appConfig.network };

function isElectronRuntime() {
  return typeof window !== "undefined" && !!window.electronAPI;
}

function applyRuntimeConfig(config: Pick<AppConfig, "backend" | "network">) {
  runtimeNetworkConfig = { ...config.network };
  baseURL = `http://${config.backend.host}:${config.backend.port}`;
  request.defaults.baseURL = baseURL;
}

function getNetworkConfig() {
  if (typeof window === "undefined" || isElectronRuntime()) {
    return runtimeNetworkConfig;
  }

  try {
    const stored = localStorage.getItem(WEB_NETWORK_SETTINGS_KEY);
    if (stored) {
      return {
        ...runtimeNetworkConfig,
        ...JSON.parse(stored),
      };
    }
  } catch {
    // Ignore malformed local cache.
  }

  return runtimeNetworkConfig;
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
    if (nextConfig) {
      applyRuntimeConfig(nextConfig);
    }
  });
}

request.interceptors.request.use(
  (config: CustomAxiosRequestConfig) => {
    if (!baseURL) {
      throw new Error("BACKEND_URL is not configured.");
    }

    const networkConfig = getNetworkConfig();
    config.baseURL = baseURL;
    config.timeout = networkConfig.timeout;
    config.retryCount ??= 0;

    config.params = {
      ...config.params,
      timestamp: Date.now(),
      ...(isElectronRuntime() ? { os: "pc" } : { platform: "web" }),
      randomCNIP: networkConfig.randomCNIP,
      ...(isElectronRuntime() && networkConfig.proxyMode === "custom" && networkConfig.proxyUrl
        ? { proxy: networkConfig.proxyUrl }
        : {}),
    };

    return config;
  },
  (error) => Promise.reject(error),
);

request.interceptors.response.use(
  (response) => {
    const responseData = response.data;

    if (responseData && [250].includes(responseData.code)) {
      return Promise.reject({
        ...response,
        isBusinessError: true,
        businessMsg: responseData.msg || responseData.message,
        businessCode: responseData.code,
      });
    }

    return response;
  },
  async (error) => {
    const responseData = error.response?.data;
    const apiMsg = responseData?.msg || responseData?.message || error.message;
    const statusCode = error.response?.status || error.code || "UNKNOWN";
    const config = error.config as CustomAxiosRequestConfig | undefined;

    if (responseData) {
      console.error(`[API ${statusCode}] ${apiMsg}`, {
        url: error.config?.url,
        method: error.config?.method,
        status: statusCode,
        data: responseData,
      });

      if (apiMsg && typeof window !== "undefined") {
        const { translate } = await import("@/lib/i18n");
        const { useI18nStore } = await import("@/store/module/i18n");
        const { toast } = await import("sonner");
        toast.error(
          translate(useI18nStore.getState().locale, "common.message.operationFailedWithReason", {
            message: apiMsg,
          }),
        );
      }
    } else {
      console.error(`[API ${statusCode}] Network or Server Error`, error);
    }

    if (!config) {
      return Promise.reject(error);
    }

    if (
      error.response?.status === 301 &&
      (config.params as { noLogin?: boolean } | undefined)?.noLogin !== true
    ) {
      useUserStore.getState().handleLogout();
      usePlayerStore.getState().cleanCache();
      config.retryCount = 3;
    }

    const { max_retries, retry_delay } = getNetworkConfig();
    const shouldRetry =
      config.retryCount !== undefined &&
      config.retryCount < max_retries &&
      !NO_RETRY_URLS.includes(config.url as string) &&
      !config.noRetry;

    if (shouldRetry) {
      config.retryCount = (config.retryCount ?? 0) + 1;
      logger.warn(`Request retrying: ${config.retryCount}/${max_retries}`);
      await new Promise((resolve) => setTimeout(resolve, retry_delay));
      return request(config);
    }

    logger.warn(`Request failed after ${max_retries} retries.`);
    return Promise.reject(error);
  },
);

export default request;
