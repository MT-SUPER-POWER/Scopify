"use client";

import { useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { useLoginStatus } from "@/hooks/auth/useLoginStatus";
import { useSmartRouter } from "@/hooks/core/useSmartRouter";
import { loginWithYidun, sendYidunCaptcha } from "@/lib/api/yidun";
import { bindYidunDevice } from "@/lib/auth/yidunDevice";
import { getYidunErrorMessage } from "@/lib/auth/yidunError";
import { verifyYidunSlider } from "@/lib/auth/yidunSlider";
import { createFreshLoginDevice, resolveLocalDeviceName } from "@/lib/devices/clientIdentity";
import { completeFreshLogin } from "@/lib/devices/completeLogin";
import { runtime } from "@/lib/runtime";
import { getBackendBaseUrl } from "@/lib/web/request";
import type { YidunResponse, YidunSession } from "@/types/auth/yidun";

import type { LoginMode } from "@/types/auth/login";

export function useLoginFlow() {
  const smartRouter = useSmartRouter();
  const searchParams = useSearchParams();
  const { t, i18n } = useTranslation();
  const [mode, updateMode] = useState<LoginMode>("qr");
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationPhone, setVerificationPhone] = useState("");
  const sliderHost = useRef<HTMLDivElement>(null);
  const operation = useRef<AbortController | null>(null);
  const session = useRef<YidunSession | null>(null);
  useEffect(() => () => operation.current?.abort(), []);
  const setMode = (next: LoginMode) => {
    if (operation.current) return;
    session.current = null;
    setVerificationPhone("");
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

  const getSession = async (phone: string) => {
    if (
      !session.current ||
      session.current.phone !== phone ||
      session.current.device.backend !== getBackendBaseUrl()
    ) {
      session.current = {
        sid: crypto.randomUUID(),
        phone,
        device: await createFreshLoginDevice(deviceName),
      };
    }
    return session.current;
  };

  const withChallenge = async (
    send: (sca?: string) => Promise<{ data: YidunResponse }>,
    signal: AbortSignal,
    backend: string,
  ) => {
    const submit = (sca?: string) => {
      signal.throwIfAborted();
      if (backend !== getBackendBaseUrl()) throw new Error(t("login.page.loginFailed"));
      return send(sca);
    };
    let response = await submit();
    signal.throwIfAborted();
    if (response.data.code === 8821 || response.data.code === 8810) {
      setIsVerifying(true);
      // The host is always mounted; reveal it before measuring the SDK width.
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      signal.throwIfAborted();
      const host = sliderHost.current;
      if (!host) throw new Error(t("login.page.securityFailed"));
      const sca = await verifyYidunSlider(host, i18n.language, signal).catch(() => {
        throw new Error(t("login.page.securityFailed"));
      });
      setIsVerifying(false);
      response = await submit(sca);
    }
    signal.throwIfAborted();
    return response.data;
  };

  const handleSubmit = async (phone: string, extra: string) => {
    if (operation.current) return;
    const controller = new AbortController();
    operation.current = controller;
    setIsLoading(true);
    try {
      const current = await getSession(phone.trim());
      controller.signal.throwIfAborted();
      const data = await withChallenge(
        (sca) =>
          loginWithYidun(
            {
              sid: current.sid,
              phone: current.phone,
              sca,
              ...(mode === "password" ? { password: extra } : { captcha: extra }),
            },
            controller.signal,
          ),
        controller.signal,
        current.device.backend,
      );
      if (current.device.backend !== getBackendBaseUrl()) {
        throw new Error(t("login.page.loginFailed"));
      }
      if (data.code === 8830) {
        setVerificationPhone(current.phone);
        updateMode("sms");
        toast.info(t("login.page.secondaryVerification"));
        return;
      }
      if (data.code !== 200) throw new Error(data.msg || t("login.page.loginFailed"));
      const cookie = data.cookie ?? "";
      const device = bindYidunDevice(cookie, current.device);
      const result = await completeFreshLogin(cookie, "token", device);
      if (!result.nameSynced) toast.warning(t("devices.syncFailed"));
      if (!runtime.auth.completeLogin()) finishLogin();
    } catch (error) {
      if (!controller.signal.aborted) {
        toast.error(getYidunErrorMessage(error, t("login.page.loginFailed")));
      }
    } finally {
      operation.current = null;
      setIsVerifying(false);
      setIsLoading(false);
    }
  };

  const handleSendCaptcha = async (phone: string) => {
    if (operation.current) return false;
    const controller = new AbortController();
    operation.current = controller;
    setIsLoading(true);
    try {
      const current = await getSession(phone.trim());
      controller.signal.throwIfAborted();
      const data = await withChallenge(
        (sca) =>
          sendYidunCaptcha(
            {
              sid: current.sid,
              phone: current.phone,
              sca,
            },
            controller.signal,
          ),
        controller.signal,
        current.device.backend,
      );
      if (current.device.backend !== getBackendBaseUrl() || data.code !== 200) {
        throw new Error(data.msg || t("login.page.sendCaptchaFailed"));
      }
      return true;
    } catch (error) {
      if (!controller.signal.aborted) {
        toast.error(getYidunErrorMessage(error, t("login.page.sendCaptchaFailed")));
      }
      return false;
    } finally {
      operation.current = null;
      setIsVerifying(false);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) finishLogin();
  }, [finishLogin, isLoggedIn]);

  useEffect(() => {
    // 组件挂载后标记为 true
    setIsMounted(true);
    if (isLoggedIn) finishLogin();
  }, [finishLogin, isLoggedIn]);

  return {
    mode,
    setMode,
    sliderHost,
    isVerifying,
    verificationPhone,
    cancelVerification: () => operation.current?.abort(),
    isLoading,
    deviceName,
    isLoggedIn,
    isMounted,
    finishLogin,
    handleSubmit,
    handleSendCaptcha,
  };
}
