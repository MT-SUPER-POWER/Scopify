import request, { requestConfig } from "@/lib/providers/netease/client";
import type { YidunLoginParams, YidunResponse, YidunSendParams } from "@/types/auth/yidun";

// Risk challenges can arrive with an HTTP error status. Preserve their business
// codes so the login flow can ask the user to complete verification.
const challengeConfig = () =>
  requestConfig({
    noLogin: true,
    includeDefaultParams: false,
    withCredentials: false,
    headers: { "Content-Type": "application/json" },
    expectedBusinessCodes: [200, 8810, 8821, 8830],
    validateStatus: (status) => status >= 200 && status < 600,
  });

export function loginWithYidun(params: YidunLoginParams, signal?: AbortSignal) {
  const code = params.countrycode || params.ctcode || "86";
  return request.post<YidunResponse>(
    "/yidun/login",
    { ...params, countrycode: code, ctcode: code },
    {
      ...challengeConfig(),
      signal,
    },
  );
}

export function sendYidunCaptcha(params: YidunSendParams, signal?: AbortSignal) {
  const code = params.countrycode || params.ctcode || "86";
  return request.post<YidunResponse>(
    "/yidun/send",
    { ...params, ctcode: code, countrycode: code },
    {
      ...challengeConfig(),
      signal,
    },
  );
}
