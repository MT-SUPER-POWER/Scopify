import { getQqSessionToken, QQ_SESSION_COOKIE_NAME } from "@/lib/providers/qq/session";
import { notifyExpiredQqSession } from "@/lib/query/session";
import { runtime } from "@/lib/runtime";
import { createApiClient } from "@/lib/web/http/createApiClient";
import type { QqRequestConfig } from "@/types/providers/qq/request";

/** Header the QQ backend reads first; it only allows it on same-origin requests (CORS). */
const QQ_SESSION_HEADER = "x-qq-session";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isSameOrigin(baseUrl: string | undefined) {
  if (!baseUrl || typeof window === "undefined") return false;
  try {
    return new URL(baseUrl, window.location.href).origin === window.location.origin;
  } catch {
    return false;
  }
}

/**
 * QQ Music API client. Newer routes report failure through the HTTP status, so the shared
 * error handling covers them; legacy routes that reply 200 with a body code opt in per call
 * through `expectedBusinessCodes`. None of NetEase's default parameters are sent.
 *
 * The QQ session goes in the `x-qq-session` header when the backend shares the page's origin.
 * Its CORS policy lists neither that header nor credentials, so cross-origin requests (the
 * Desktop-hosted API, a dev backend on another port) send `?cookie=qqmusic_session=<token>`,
 * which the backend accepts in the same way, and no browser cookies.
 */
export const qqClient = createApiClient<QqRequestConfig>({
  platform: "qq",
  desktopBackend: runtime.qqBackend,
  withCredentials: false,
  prepareRequest(config) {
    const token = config.noSession ? null : getQqSessionToken();
    if (!token) return;
    if (isSameOrigin(config.baseURL)) {
      config.headers.set(QQ_SESSION_HEADER, token);
      return;
    }
    const params = isRecord(config.params) ? config.params : {};
    config.params = { ...params, cookie: `${QQ_SESSION_COOKIE_NAME}=${token}` };
  },
  onError(error) {
    // The backend answers 401 when the session is missing or the upstream rejects its credential.
    const config = error.config as QqRequestConfig | undefined;
    if (error.status === 401 && !config?.noSession && getQqSessionToken()) {
      notifyExpiredQqSession();
    }
  },
});

export const getQqBaseUrl = qqClient.getBaseUrl;
