import request, { requestConfig } from "@/lib/web/request";
import type { YidunLoginParams, YidunResponse } from "@/types/auth/yidun";

// Risk challenges can arrive with an HTTP error status. Preserve their business
// codes so the login flow can ask the user to complete verification.
const challengeConfig = () =>
  requestConfig({
    params: { noLogin: true },
    expectedBusinessCodes: [200, 8810, 8821, 8830],
    validateStatus: (status) => status >= 200 && status < 600,
  });

export function loginWithYidun(params: YidunLoginParams, signal?: AbortSignal) {
  return request.post<YidunResponse>("/yidun/login", params, {
    ...challengeConfig(),
    signal,
  });
}

export function sendYidunCaptcha(
  params: Pick<YidunLoginParams, "sid" | "phone" | "sca">,
  signal?: AbortSignal,
) {
  return request.post<YidunResponse>("/yidun/send", params, {
    ...challengeConfig(),
    signal,
  });
}
