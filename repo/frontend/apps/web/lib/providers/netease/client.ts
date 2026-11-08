import { notifyExpiredMusicSession } from "@/lib/query/session";
import { runtime } from "@/lib/runtime";
import { createApiClient } from "@/lib/web/http/createApiClient";
import {
  attachMusicSessionCredential,
  getMusicSessionCredential,
} from "@/lib/web/musicSessionCredential";
import type { NeteaseRequestConfig } from "@/types/providers/netease/request";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isNoLoginRequest(config?: NeteaseRequestConfig) {
  if (config?.noLogin === true) return true;
  const params = config?.params as unknown;
  return isRecord(params) && params.noLogin === true;
}

/**
 * NetEase Cloud Music API client. The session credential, the `timestamp` / `os` / `platform` /
 * `randomCNIP` defaults and the `code: 250` failure are NetEase conventions and stay here.
 */
export const neteaseClient = createApiClient<NeteaseRequestConfig>({
  provider: "netease",
  addressKey: "backend",
  desktopBackend: runtime.backend,
  prepareRequest(config, network) {
    const credential = getMusicSessionCredential();
    const requestParams = isRecord(config.params) ? config.params : {};
    const sessionParams =
      credential && !isNoLoginRequest(config)
        ? attachMusicSessionCredential(requestParams, credential)
        : requestParams;

    config.params =
      config.includeDefaultParams === false
        ? sessionParams
        : {
            ...sessionParams,
            timestamp: Date.now(),
            ...(runtime.isDesktop ? { os: "pc" } : { platform: "web" }),
            randomCNIP: network.randomCNIP,
          };
  },
  isBusinessFailure: (data) => isRecord(data) && data.code === 250,
  onError(error) {
    if (error.kind === "unauthenticated" && !isNoLoginRequest(error.config)) {
      notifyExpiredMusicSession();
    }
  },
});

/** The axios instance for NetEase calls that need the full response. */
const neteaseRequest = neteaseClient.instance;

export const getNeteaseBaseUrl = neteaseClient.getBaseUrl;
export const requestData = neteaseClient.requestData;
export const requestConfig = neteaseClient.requestConfig;

export default neteaseRequest;
