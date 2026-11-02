import { beforeEach, expect, mock, test } from "bun:test";
import type { YidunClientOptions, YidunResponse } from "@/types/auth/yidun";

let backend = "https://backend.example";
const send = mock(async (_params: unknown, _signal?: AbortSignal) => ({
  data: { code: 200 } as YidunResponse,
}));
mock.module("@/lib/api/yidun", () => ({ loginWithYidun: send, sendYidunCaptcha: send }));
mock.module("@/lib/web/request", () => ({ getBackendBaseUrl: () => backend }));
const { createYidunClient, nextYidunStep } = await import("@/lib/auth/yidunClient");
const params = { sid: "session", phone: "51234567", countrycode: "852" };

function setup(verifySlider: YidunClientOptions["verifySlider"] = mock(async () => "validate")) {
  const controller = new AbortController();
  return {
    controller,
    verifySlider,
    client: createYidunClient({ backend, signal: controller.signal, verifySlider }),
  };
}

beforeEach(() => {
  backend = "https://backend.example";
  send.mockReset();
  send.mockResolvedValue({ data: { code: 200 } });
});

test("successful login does not mount a slider", async () => {
  const { client, verifySlider } = setup();
  expect(await client.login({ ...params, password: "secret" })).toEqual({ code: 200 });
  expect(verifySlider).not.toHaveBeenCalled();
});

test("login retries with the same session and sca before requesting SMS verification", async () => {
  send.mockResolvedValueOnce({ data: { code: 8821 } });
  send.mockResolvedValueOnce({ data: { code: 8830 } });
  const { client, controller } = setup();
  expect(nextYidunStep(await client.login({ ...params, password: "secret" }))).toBe("captcha");
  expect(send).toHaveBeenLastCalledWith(
    { ...params, password: "secret", sca: "validate" },
    controller.signal,
  );
  expect(send).toHaveBeenCalledTimes(2);
});

test("SMS challenge retries only once even if the challenge persists", async () => {
  send.mockResolvedValue({ data: { code: 8810 } });
  const { client, verifySlider } = setup();
  expect(nextYidunStep(await client.sendSms(params))).toBe("slider");
  expect(send).toHaveBeenCalledTimes(2);
  expect(verifySlider).toHaveBeenCalledTimes(1);
});

test("cancelling during verification prevents retry", async () => {
  send.mockResolvedValueOnce({ data: { code: 8821 } });
  const { client, controller } = setup(async () => {
    controller.abort();
    return "validate";
  });
  await expect(client.login(params)).rejects.toThrow();
  expect(send).toHaveBeenCalledTimes(1);
});

test("switching backend during verification prevents retry", async () => {
  send.mockResolvedValueOnce({ data: { code: 8821 } });
  const { client } = setup(async () => {
    backend = "https://other.example";
    return "validate";
  });
  await expect(client.login(params)).rejects.toThrow("Login backend changed");
  expect(send).toHaveBeenCalledTimes(1);
});

test("slider failures propagate without retry", async () => {
  send.mockResolvedValueOnce({ data: { code: 8821 } });
  const { client } = setup(async () => {
    throw new Error("slider failed");
  });
  await expect(client.sendSms(params)).rejects.toThrow("slider failed");
  expect(send).toHaveBeenCalledTimes(1);
});

test("the real 8821 payload reaches verification before the submitting stage", async () => {
  const challenge: YidunResponse = {
    code: 8821,
    msg: "需要行为验证码验证",
    body: { captchaId: "73a18dc827b24b18ad0783701a75277d" },
  };
  send.mockResolvedValueOnce({ data: challenge });
  const stages: string[] = [];
  const controller = new AbortController();
  const verifySlider = mock(async () => {
    stages.push("slider");
    return "challenge-validate";
  });
  const client = createYidunClient({
    backend,
    signal: controller.signal,
    verifySlider,
    onRetry: () => stages.push("retrying"),
  });
  await client.login(params);
  expect(verifySlider).toHaveBeenCalledWith(controller.signal, challenge);
  expect(stages).toEqual(["slider", "retrying"]);
  expect(send).toHaveBeenLastCalledWith(
    { ...params, sca: "challenge-validate" },
    controller.signal,
  );
});
