import { runtime } from "@/lib/runtime";
import { createApiClient } from "@/lib/web/http/createApiClient";
import type { ApiRequestConfig } from "@/types/network/model";

/**
 * QQ Music API client. Newer routes report failure through the HTTP status, so the shared
 * error handling covers them; legacy routes that reply 200 with a body code opt in per call
 * through `expectedBusinessCodes`. None of NetEase's default parameters are sent. The QQ
 * session (the `qqmusic_session` cookie or the auth header) is wired up with QQ login.
 */
export const qqClient = createApiClient<ApiRequestConfig>({
  provider: "qq",
  addressKey: "qqBackend",
  desktopBackend: runtime.qqBackend,
});

export const getQqBaseUrl = qqClient.getBaseUrl;
