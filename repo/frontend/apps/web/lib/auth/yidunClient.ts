import { loginWithYidun, sendYidunCaptcha } from "@/lib/api/yidun";
import { getNeteaseBaseUrl } from "@/lib/providers/netease/client";
import type {
  YidunClientOptions,
  YidunLoginParams,
  YidunResponse,
  YidunSendParams,
} from "@/types/auth/yidun";

/** Keep transport, slider retry and response classification in one login client. */
export function createYidunClient({ signal, backend, verifySlider, onRetry }: YidunClientOptions) {
  const assertActive = () => {
    signal.throwIfAborted();
    if (backend !== getNeteaseBaseUrl()) throw new Error("Login backend changed");
  };
  const submit = async (send: (sca?: string) => Promise<{ data: YidunResponse }>) => {
    assertActive();
    let { data } = await send();
    assertActive();
    if (nextYidunStep(data) === "slider") {
      const sca = await verifySlider(signal, data);
      assertActive();
      onRetry?.();
      ({ data } = await send(sca));
      assertActive();
    }
    return data;
  };

  return {
    login: (params: YidunLoginParams) =>
      submit((sca = params.sca) => loginWithYidun({ ...params, sca }, signal)),
    sendSms: (params: YidunSendParams) =>
      submit((sca = params.sca) => sendYidunCaptcha({ ...params, sca }, signal)),
  };
}

export function nextYidunStep(response: YidunResponse) {
  switch (Number(response.code)) {
    case 200:
      return "done";
    case 8830:
      return "captcha";
    case 8821:
    case 8810:
      return "slider";
    default:
      return "failed";
  }
}
