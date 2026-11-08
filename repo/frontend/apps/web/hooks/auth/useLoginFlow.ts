"use client";

import { useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { useLoginStatus } from "@/hooks/auth/useLoginStatus";
import { useSmartRouter } from "@/hooks/core/useSmartRouter";
import { createYidunClient, nextYidunStep } from "@/lib/auth/yidunClient";
import { bindYidunDevice } from "@/lib/auth/yidunDevice";
import { getYidunErrorMessage } from "@/lib/auth/yidunError";
import { verifyYidunSlider } from "@/lib/auth/yidunSlider";
import { createFreshLoginDevice, resolveLocalDeviceName } from "@/lib/devices/clientIdentity";
import { completeFreshLogin } from "@/lib/devices/completeLogin";
import { runtime } from "@/lib/runtime";
import { getNeteaseBaseUrl } from "@/lib/providers/netease/client";
import type {
  YidunLoginParams,
  YidunResponse,
  YidunSession,
  YidunVerification,
} from "@/types/auth/yidun";

import type { LoginMode } from "@/types/auth/login";

const CAPTCHA_VALIDITY_MS = 10 * 60 * 1000;
const LOGIN_MODE_STORAGE_KEY = "scopify-last-login-mode";

function getRememberedLoginMode(): LoginMode | null {
  if (typeof window === "undefined") return null;
  try {
    const saved = localStorage.getItem(LOGIN_MODE_STORAGE_KEY);
    if (saved === "qr" || saved === "password") {
      return saved;
    }
  } catch {
    /* Storage can be unavailable. */
  }
  return null;
}

function rememberLoginMode(mode: LoginMode) {
  if (typeof window === "undefined") return;
  try {
    if (mode === "qr" || mode === "password") {
      localStorage.setItem(LOGIN_MODE_STORAGE_KEY, mode);
    }
  } catch {
    /* Storage can be unavailable. */
  }
}

/**
 * NetEase login on the login page. `isNeteaseChosen` is false while the page logs into another
 * platform, so an existing NetEase session does not send the page away.
 */
export function useLoginFlow(isNeteaseChosen = true) {
  const smartRouter = useSmartRouter();
  const searchParams = useSearchParams();
  const { t, i18n } = useTranslation();
  const [mode, updateMode] = useState<LoginMode>("qr");
  const [isLoading, setIsLoading] = useState(false);
  const [verification, setVerification] = useState<YidunVerification | null>(null);
  const verificationActive = useRef(false);
  const [smsSession, setSmsSession] = useState<YidunSession | null>(null);
  const sliderHost = useRef<HTMLDivElement | null>(null);
  const onSliderMount = useRef<(() => void) | null>(null);
  const setSliderHost = useCallback((host: HTMLDivElement | null) => {
    sliderHost.current = host;
    if (host) onSliderMount.current?.();
  }, []);
  const operation = useRef<AbortController | null>(null);
  const session = useRef<YidunSession | null>(null);
  useEffect(() => () => operation.current?.abort(), []);
  const setMode = (next: LoginMode) => {
    if (operation.current || verification) return;
    rememberLoginMode(next);
    updateMode(next);
  };
  const [deviceName, setDeviceName] = useState("");
  useEffect(() => {
    let active = true;
    void resolveLocalDeviceName().then((name) => {
      if (active) setDeviceName(name);
    });
    return () => {
      active = false;
    };
  }, []);

  const isLoggedIn = useLoginStatus();
  const [isMounted, setIsMounted] = useState(false);
  const redirectTarget = useMemo(() => searchParams.get("redirect") || "/", [searchParams]);
  const finishLogin = useCallback(() => {
    smartRouter.replace(redirectTarget.startsWith("/") ? redirectTarget : "/");
  }, [redirectTarget, smartRouter]);

  const getSession = async (phone: string, countrycode = "86") => {
    if (
      !session.current ||
      session.current.phone !== phone ||
      session.current.countrycode !== countrycode ||
      session.current.device.backend !== getNeteaseBaseUrl()
    ) {
      session.current = {
        sid: crypto.randomUUID(),
        phone,
        countrycode,
        device: await createFreshLoginDevice(deviceName),
      };
    }
    return session.current;
  };

  const verifySlider = async (signal: AbortSignal, challenge: YidunResponse) => {
    verificationActive.current = true;
    try {
      const host = await new Promise<HTMLDivElement>((resolve, reject) => {
        const cleanup = () => {
          onSliderMount.current = null;
          signal.removeEventListener("abort", cancel);
        };
        const cancel = () => {
          cleanup();
          reject(signal.reason);
        };
        const mounted = () => {
          if (!sliderHost.current) return;
          cleanup();
          resolve(sliderHost.current);
        };
        onSliderMount.current = mounted;
        signal.addEventListener("abort", cancel, { once: true });
        setVerification({ stage: "loading" });
        if (signal.aborted) cancel();
        else mounted();
      });
      return await verifyYidunSlider(host, i18n.language, signal, {
        captchaId: challenge.body?.captchaId || challenge.captchaId,
        onReady: () => setVerification({ stage: "ready" }),
      });
    } catch {
      throw new Error(t("login.page.securityFailed"));
    }
  };

  const onVerificationRetry = () => setVerification({ stage: "retrying" });

  const runOperation = async <T>(
    fallback: string,
    run: (signal: AbortSignal) => Promise<T>,
  ): Promise<T | undefined> => {
    if (operation.current) return;
    const controller = new AbortController();
    operation.current = controller;
    verificationActive.current = Boolean(smsSession);
    if (smsSession) setVerification({ stage: "sms" });
    setIsLoading(true);
    try {
      return await run(controller.signal);
    } catch (error) {
      if (!controller.signal.aborted) {
        const message = getYidunErrorMessage(error, fallback);
        if (smsSession) setVerification({ stage: "sms", message });
        else if (verificationActive.current) setVerification({ stage: "failed", message });
        else toast.error(message);
      }
    } finally {
      operation.current = null;
      setIsLoading(false);
    }
  };

  const login = async (
    current: YidunSession,
    credentials: Pick<YidunLoginParams, "password" | "captcha">,
    signal: AbortSignal,
  ) => {
    const client = createYidunClient({
      signal,
      backend: current.device.backend,
      verifySlider,
      onRetry: onVerificationRetry,
    });
    const data = await client.login({
      sid: current.sid,
      phone: current.phone,
      countrycode: current.countrycode,
      ...credentials,
    });
    if (nextYidunStep(data) === "captcha") {
      const pending = { ...current, captchaSent: false, captchaSentAt: undefined };
      session.current = pending;
      setSmsSession(pending);
      setVerification({ stage: "sms" });
      return;
    }
    if (nextYidunStep(data) !== "done") {
      throw new Error(data.msg || data.message || t("login.page.loginFailed"));
    }
    const cookie = data.cookie ?? "";
    const device = bindYidunDevice(cookie, current.device);
    const result = await completeFreshLogin(cookie, "token", device);
    signal.throwIfAborted();
    session.current = null;
    setSmsSession(null);
    setVerification(null);
    if (!result.nameSynced) toast.warning(t("devices.syncFailed"));
    if (!runtime.auth.completeLogin()) finishLogin();
  };

  const handleSubmit = async (phone: string, password: string, countrycode = "86") => {
    if (verification) return;
    await runOperation(t("login.page.loginFailed"), async (signal) => {
      const current = await getSession(phone.trim(), countrycode);
      await login(current, { password }, signal);
    });
  };

  const handleSubmitCaptcha = async (captcha: string) => {
    if (!smsSession || operation.current) return;
    if (!smsSession.captchaSent) {
      toast.warning(t("login.page.pleaseSendCaptchaFirst"));
      return;
    }
    if (smsSession.captchaSentAt && Date.now() - smsSession.captchaSentAt > CAPTCHA_VALIDITY_MS) {
      toast.warning(t("login.page.captchaExpired"));
      return;
    }
    if (!/^\d{4}$/.test(captcha.trim())) {
      toast.warning(t("login.page.invalidCaptchaLength"));
      return;
    }
    await runOperation(t("login.page.loginFailed"), (signal) =>
      login(smsSession, { captcha: captcha.trim() }, signal),
    );
  };

  const handleSendCaptcha = async () => {
    if (!smsSession) return false;
    return (
      (await runOperation(t("login.page.sendCaptchaFailed"), async (signal) => {
        const client = createYidunClient({
          signal,
          backend: smsSession.device.backend,
          verifySlider,
          onRetry: onVerificationRetry,
        });
        const data = await client.sendSms({
          sid: smsSession.sid,
          phone: smsSession.phone,
          countrycode: smsSession.countrycode,
        });
        if (nextYidunStep(data) !== "done") {
          throw new Error(data.msg || data.message || t("login.page.sendCaptchaFailed"));
        }
        const pending = { ...smsSession, captchaSent: true, captchaSentAt: Date.now() };
        session.current = pending;
        setSmsSession(pending);
        setVerification({ stage: "sms" });
        return true;
      })) ?? false
    );
  };

  useEffect(() => {
    if (isLoggedIn && isNeteaseChosen) finishLogin();
  }, [finishLogin, isLoggedIn, isNeteaseChosen]);

  useEffect(() => {
    setIsMounted(true);
    const urlMode = searchParams.get("mode");
    if (urlMode === "qr" || urlMode === "password") {
      updateMode(urlMode);
      rememberLoginMode(urlMode);
      return;
    }
    const remembered = getRememberedLoginMode();
    if (remembered) {
      updateMode(remembered);
    }
  }, [searchParams]);

  return {
    mode,
    setMode,
    setSliderHost,
    verification,
    smsSession,
    cancelVerification: () => {
      operation.current?.abort();
      session.current = null;
      setSmsSession(null);
      setVerification(null);
    },
    isLoading,
    deviceName,
    isLoggedIn: isLoggedIn && isNeteaseChosen,
    isMounted,
    finishLogin,
    handleSubmit,
    handleSendCaptcha,
    handleSubmitCaptcha,
  };
}
