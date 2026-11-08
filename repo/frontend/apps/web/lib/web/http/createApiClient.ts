import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from "axios";

import { runtime } from "@/lib/runtime";
import type { RuntimeBackend } from "@/lib/runtime/types";
import type { ApiRequestConfig } from "@/types/network/model";
import { webConfigSchema, type BackendPlatform, type WebConfig } from "@/types/settings/config";

import { ApiError, toApiError } from "../apiError";
import { buildBackendBaseUrl, normalizeBackendConfig } from "../backendUrl";
import { webConfig } from "../env";
import { reportFailure } from "../errorTracking";
import {
  loadStoredBackendAddress,
  loadStoredNeteaseConfig,
  loadStoredNetworkConfig,
} from "./storedSettings";

export interface ApiClientOptions<C extends ApiRequestConfig> {
  /**
   * The platform whose `backend.<platform>` address is used when no Desktop-managed API is
   * running; also the provider name added to failure reports.
   */
  platform: BackendPlatform;
  /** The Desktop-managed API; its origin wins while it runs. */
  desktopBackend?: RuntimeBackend;
  /** Platform-specific request preparation, such as session and default parameters. */
  prepareRequest?: (config: InternalAxiosRequestConfig & C, settings: RequestSettings) => void;
  /** True when a 2xx body still reports failure under the platform's own convention. */
  isBusinessFailure?: (data: unknown, config: C) => boolean;
  /** Platform reaction to a failed request, before it is reported. */
  onError?: (error: ApiError) => void;
}

export interface ApiClient<C extends ApiRequestConfig> {
  /** The axios instance, for callers that need the full response. */
  readonly instance: AxiosInstance;
  /** The base URL requests currently go to. */
  getBaseUrl(): string;
  /** Sends a request and returns only the response body. */
  requestData<T>(config: C): Promise<T>;
  /** Types a request config for this client without sending it. */
  requestConfig<D = unknown>(config: C & ApiRequestConfig<D>): C & ApiRequestConfig<D>;
}

/** Request options in effect: the shared network options and each platform's own. */
export type RequestSettings = Pick<WebConfig, "netease" | "network">;

/**
 * The config carried by an `app-config-updated` event. A payload in the flat shape used before
 * addresses were split by platform is lifted into the current shape.
 */
function readWebConfigEvent(event: Event): WebConfig | null {
  const detail = (event as CustomEvent<unknown>).detail;
  if (typeof detail !== "object" || detail === null) return null;
  return webConfigSchema.safeParse(detail).data ?? null;
}

let runtimeRequestSettings: RequestSettings = {
  network: { ...webConfig.network },
  netease: { ...webConfig.netease },
};

function getRequestSettings(): RequestSettings {
  return {
    network: { ...runtimeRequestSettings.network, ...loadStoredNetworkConfig() },
    netease: { ...runtimeRequestSettings.netease, ...loadStoredNeteaseConfig() },
  };
}

if (typeof window !== "undefined") {
  window.addEventListener("app-config-updated", (event) => {
    const next = readWebConfigEvent(event);
    if (next)
      runtimeRequestSettings = { network: { ...next.network }, netease: { ...next.netease } };
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function businessMessage(data: unknown) {
  if (!isRecord(data)) return "Business request failed";
  if (typeof data.msg === "string" && data.msg) return data.msg;
  if (typeof data.message === "string" && data.message) return data.message;
  return "Business request failed";
}

function createRequestTraceId() {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `request-${Date.now()}-${Math.random().toString(16).slice(2)}`
  );
}

function reportRequestError(provider: string, error: ApiError) {
  reportFailure({
    context: {
      provider,
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

/**
 * Tracks where one platform's requests go: the configured address, replaced by the
 * Desktop-managed API's origin while that API runs.
 */
function createBaseUrlSource(platform: BackendPlatform, desktopBackend?: RuntimeBackend) {
  let configured = loadStoredBackendAddress(platform) ?? webConfig.backend[platform];
  let desktopOrigin: string | null = null;

  if (typeof window !== "undefined") {
    window.addEventListener("app-config-updated", (event) => {
      const next = readWebConfigEvent(event)?.backend[platform];
      if (!next) return;
      const resolved = normalizeBackendConfig(next);
      configured = resolved.ok ? resolved.backend : { ...next };
    });

    if (desktopBackend) {
      const track = (status: Awaited<ReturnType<RuntimeBackend["getStatus"]>> | null) => {
        // Only a disabled API hands requests back to the configured address; a restart keeps the origin.
        if (status?.state === "disabled") desktopOrigin = null;
        if (status?.state === "running" && status.origin) desktopOrigin = status.origin;
      };
      void Promise.resolve(desktopBackend.getStatus())
        .then(track)
        .catch(() => {});
      desktopBackend.onStatusChanged(track);
    }
  }

  return () => desktopOrigin ?? buildBackendBaseUrl(configured);
}

/** One axios client per platform backend: shared transport behaviour plus the platform's own rules. */
export function createApiClient<C extends ApiRequestConfig>(
  options: ApiClientOptions<C>,
): ApiClient<C> {
  const getBaseUrl = createBaseUrlSource(
    options.platform,
    runtime.isDesktop ? options.desktopBackend : undefined,
  );

  const instance = axios.create({
    baseURL: getBaseUrl(),
    timeout: getRequestSettings().network.timeout,
    withCredentials: true,
  });

  // Static export loads this module in every worker; skip the banner during the build.
  if (process.env.NEXT_PHASE !== "phase-production-build") {
    console.info(`[${options.platform}] request backend URL is`, getBaseUrl());
  }

  instance.interceptors.request.use((raw) => {
    const config = raw as InternalAxiosRequestConfig & C;
    const baseURL = getBaseUrl();
    if (!baseURL) throw new Error(`${options.platform} backend URL is not configured.`);

    const settings = getRequestSettings();
    config.baseURL = baseURL;
    config.timeout = config.transferTimeout ?? settings.network.timeout;
    config.traceId ??= createRequestTraceId();
    options.prepareRequest?.(config, settings);
    return config;
  });

  instance.interceptors.response.use((response) => {
    const config = response.config as C;
    const data: unknown = response.data;
    const code = isRecord(data) ? data.code : undefined;
    const unexpectedCode =
      typeof code === "number" &&
      config.expectedBusinessCodes !== undefined &&
      !config.expectedBusinessCodes.includes(code);

    if (unexpectedCode || options.isBusinessFailure?.(data, config)) {
      return Promise.reject(
        new ApiError({
          config,
          data,
          kind: "business",
          message: businessMessage(data),
          status: response.status,
        }),
      );
    }
    return response;
  });

  instance.interceptors.response.use(undefined, (error: unknown) => {
    if (axios.isCancel(error)) return Promise.reject(error);
    const apiError = toApiError(error);
    options.onError?.(apiError);
    reportRequestError(options.platform, apiError);
    return Promise.reject(apiError);
  });

  return {
    instance,
    getBaseUrl,
    async requestData<T>(config: C) {
      const response = await instance.request<T>(config);
      return response.data;
    },
    requestConfig: (config) => config,
  };
}
