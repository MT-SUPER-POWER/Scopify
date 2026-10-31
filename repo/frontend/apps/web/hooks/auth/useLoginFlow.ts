"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { useLoginStatus } from "@/hooks/auth/useLoginStatus";
import { useSmartRouter } from "@/hooks/core/useSmartRouter";
import { loginByCellphone } from "@/lib/api/login";
import { createFreshLoginDevice, resolveLocalDeviceName } from "@/lib/devices/clientIdentity";
import { completeFreshLogin } from "@/lib/devices/completeLogin";
import { runtime } from "@/lib/runtime";
import { sendCaptcha } from "@/lib/web/auth";
import { useI18n } from "@/store/module/i18n";
import type { LoginMode } from "@/types/auth/login";

export function useLoginFlow() {
  const smartRouter = useSmartRouter();
  const searchParams = useSearchParams();
  const { t } = useI18n();
  const [mode, setMode] = useState<LoginMode>("qr");
  const [isLoading, setIsLoading] = useState(false);
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

  // 1. 处理密码或验证码提交
  const handleSubmit = async (phone: string, extra: string) => {
    setIsLoading(true);
    try {
      const device = await createFreshLoginDevice(deviceName);
      const response = await loginByCellphone({
        phone,
        ...(mode === "password" ? { password: extra } : { captcha: extra }),
        cookie: device.cookie,
        noLogin: true,
      });
      if (response.data.code !== 200)
        throw new Error(response.data.message || t("login.page.loginFailed"));
      const result = await completeFreshLogin(response.data.cookie ?? "", "token", device);
      if (!result.nameSynced) toast.warning(t("devices.syncFailed"));
      if (!runtime.auth.completeLogin()) finishLogin();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("login.page.loginFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  // 2. 发送验证码逻辑
  const handleSendCaptcha = async (phone: string) => {
    try {
      await sendCaptcha(phone);
      return true;
    } catch (error) {
      console.error("发送验证码失败", error);
      toast.error(t("login.page.sendCaptchaFailed"));
      return false;
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
    isLoading,
    deviceName,
    isLoggedIn,
    isMounted,
    finishLogin,
    handleSubmit,
    handleSendCaptcha,
  };
}
