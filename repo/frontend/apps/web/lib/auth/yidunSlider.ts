import type { InitNECaptcha, YidunInstance, YidunSliderOptions } from "@/types/auth/yidun";

let sdkPromise: Promise<InitNECaptcha> | undefined;

function loadSdk(): Promise<InitNECaptcha> {
  const sdkWindow = window as Window & { initNECaptcha?: InitNECaptcha };
  if (sdkWindow.initNECaptcha) return Promise.resolve(sdkWindow.initNECaptcha);
  if (sdkPromise) return sdkPromise;
  sdkPromise = new Promise<InitNECaptcha>((resolve, reject) => {
    const script = document.createElement("script");
    const fail = () => {
      script.remove();
      reject(new Error("Unable to load security verification"));
    };
    const timer = setTimeout(fail, 15_000);
    script.src = "https://cstaticdun.126.net/load.min.js";
    script.async = true;
    script.onload = () => {
      clearTimeout(timer);
      if (sdkWindow.initNECaptcha) resolve(sdkWindow.initNECaptcha);
      else fail();
    };
    script.onerror = () => {
      clearTimeout(timer);
      fail();
    };
    document.head.appendChild(script);
  }).catch((error: unknown) => {
    sdkPromise = undefined;
    throw error;
  });
  return sdkPromise;
}

/** The caller owns the host; aborting always settles and destroys this attempt. */
export function verifyYidunSlider(
  host: HTMLElement,
  lang: string,
  signal: AbortSignal,
  options: YidunSliderOptions = {},
): Promise<string> {
  return new Promise((resolve, reject) => {
    let instance: YidunInstance | undefined;
    let settled = false;
    const finish = (value?: string) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      signal.removeEventListener("abort", cancel);
      try {
        instance?.destroy();
      } catch {
        // A broken third-party widget must not leave the login promise pending.
      }
      host.replaceChildren();
      if (value) resolve(value);
      else reject(new Error("Security verification failed or cancelled"));
    };
    const cancel = () => finish();
    const timer = setTimeout(cancel, 180_000);
    signal.addEventListener("abort", cancel, { once: true });
    if (signal.aborted) {
      cancel();
      return;
    }
    void loadSdk()
      .then((init) => {
        if (settled) return;
        const sliderWidth = host.clientWidth >= 280 ? host.clientWidth : 320;
        init(
          {
            captchaId: options.captchaId || "aefd3e6914a546a2a7263b20a5e8304f",
            element: host,
            mode: "embed",
            width: `${sliderWidth}px`,
            lang,
            onVerify: (error, data) => {
              if (error) return; // An incorrect drag can be retried in the same widget.
              const validate = data?.validate || data?.data?.validate;
              if (validate) finish(validate);
            },
            onError: cancel,
          },
          (ready) => {
            if (settled) ready.destroy();
            else {
              instance = ready;
              options.onReady?.();
            }
          },
          cancel,
        );
      })
      .catch(cancel);
  });
}
