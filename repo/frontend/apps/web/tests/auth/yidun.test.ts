import { afterEach, describe, expect, test } from "bun:test";
import { bindYidunDevice } from "@/lib/auth/yidunDevice";
import { verifyYidunSlider } from "@/lib/auth/yidunSlider";
import type { InitNECaptcha } from "@/types/auth/yidun";

const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
afterEach(() => {
  if (originalWindow) Object.defineProperty(globalThis, "window", originalWindow);
  else Reflect.deleteProperty(globalThis, "window");
});

function host() {
  let clears = 0;
  return {
    element: { clientWidth: 278, replaceChildren: () => clears++ } as unknown as HTMLElement,
    clears: () => clears,
  };
}

function installSdk(initNECaptcha: InitNECaptcha) {
  Object.defineProperty(globalThis, "window", { configurable: true, value: { initNECaptcha } });
}

describe("Yidun verification lifecycle", () => {
  test("uses the challenge captchaId and reports when the widget is ready", async () => {
    let captchaId = "";
    let ready = false;
    installSdk((config, onReady) => {
      captchaId = config.captchaId;
      onReady({ destroy() {} });
      config.onVerify(null, { validate: "challenge-token" });
    });
    const result = await verifyYidunSlider(host().element, "zh-CN", new AbortController().signal, {
      captchaId: "73a18dc827b24b18ad0783701a75277d",
      onReady: () => {
        ready = true;
      },
    });
    expect(result).toBe("challenge-token");
    expect(captchaId).toBe("73a18dc827b24b18ad0783701a75277d");
    expect(ready).toBe(true);
  });

  test("an incorrect drag remains retryable, success resolves and destroys the widget", async () => {
    let options: Parameters<InitNECaptcha>[0] | undefined;
    let destroys = 0;
    installSdk((config, ready) => {
      options = config;
      ready({ destroy: () => destroys++ });
    });
    const target = host();
    const result = verifyYidunSlider(target.element, "zh-CN", new AbortController().signal);
    await Promise.resolve();
    if (!options) throw new Error("SDK was not initialized");
    options.onVerify(new Error("incorrect drag"));
    expect(destroys).toBe(0);
    options.onVerify(null, { data: { validate: "verified-token" } });
    expect(await result).toBe("verified-token");
    expect(destroys).toBe(1);
    expect(target.clears()).toBe(1);
  });

  test("cancelling while SDK initialization is pending destroys a late instance", async () => {
    let ready: Parameters<InitNECaptcha>[1] | undefined;
    let destroys = 0;
    installSdk((_, onReady) => {
      ready = onReady;
    });
    const controller = new AbortController();
    const target = host();
    const result = verifyYidunSlider(target.element, "en-US", controller.signal);
    const rejected = result.catch((error: unknown) => error);
    await Promise.resolve();
    controller.abort();
    expect(await rejected).toBeInstanceOf(Error);
    if (!ready) throw new Error("SDK initialization callback was not registered");
    ready({ destroy: () => destroys++ });
    expect(destroys).toBe(1);
    expect(target.clears()).toBe(1);
  });

  test("an already cancelled attempt never initializes the SDK", async () => {
    let initialized = false;
    installSdk(() => {
      initialized = true;
    });
    const controller = new AbortController();
    controller.abort();
    await expect(verifyYidunSlider(host().element, "zh-CN", controller.signal)).rejects.toThrow();
    expect(initialized).toBe(false);
  });

  test("SDK initialization failures settle so another attempt can start", async () => {
    installSdk((_, __, fail) => fail(new Error("SDK error")));
    await expect(
      verifyYidunSlider(host().element, "zh-CN", new AbortController().signal),
    ).rejects.toThrow();
    installSdk((config, ready) => {
      ready({ destroy() {} });
      config.onVerify(null, { validate: "retry-token" });
    });
    expect(await verifyYidunSlider(host().element, "zh-CN", new AbortController().signal)).toBe(
      "retry-token",
    );
  });
});

test("login completion keeps the backend device identity instead of the local seed", () => {
  const device = bindYidunDevice("MUSIC_U=secret; deviceId=backend-id; os=pc; __csrf=csrf", {
    cookie: "deviceId=local-id; os=osx",
    name: "My Mac",
    backend: "http://localhost:3001",
  });
  expect(device.cookie).toBe("deviceId=backend-id; os=pc");
  expect(device.name).toBe("My Mac");
  expect(() => bindYidunDevice("MUSIC_U=secret", device)).toThrow("identity");
});
