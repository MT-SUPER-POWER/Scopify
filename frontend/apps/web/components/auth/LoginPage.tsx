"use client";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ PACKAGE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { Lock, QrCode, Smartphone, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type React from "react";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { LoginRequiredPrompt } from "@/components/auth/LoginRequiredPrompt";
import LoginSkeletonLoading from "@/components/auth/LoginSkeletonLoading";
import { PasswordLoginForm } from "@/components/Login/PasswordLoginForm";
import { QrLogin } from "@/components/Login/QrLogin";
import { SmsLoginForm } from "@/components/Login/SmsLoginForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { loginByCellphone } from "@/lib/api/login";
import { useLoginStatus } from "@/lib/hooks/useLoginStatus";
import { useSmartRouter } from "@/lib/hooks/useSmartRouter";
import { runtime } from "@/lib/runtime";
import { cn } from "@/lib/utils";
import { sendCaptcha } from "@/lib/web/auth";
import logo from "@/resources/icon_source.png";
import { useI18n } from "@/store/module/i18n";
import type { LoginRequiredReason } from "@/types/auth";
import type { LoginMode } from "@/types/login";

let hydrationReady = false;
let hydrationPromise: Promise<void> | null = null;

function HydrationGate({ children }: { children: React.ReactNode }) {
  if (!hydrationReady && typeof window !== "undefined") {
    if (!hydrationPromise) {
      hydrationPromise = new Promise((resolve) => {
        requestAnimationFrame(() => {
          hydrationReady = true;
          resolve();
        });
      });
    }
    throw hydrationPromise;
  }

  return <>{children}</>;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ UI ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function LoginPageContent() {
  const smartRouter = useSmartRouter();
  const searchParams = useSearchParams();
  const { t } = useI18n();
  const [mode, setMode] = useState<LoginMode>("qr");
  const [isLoading, setIsLoading] = useState(false);

  const isLoggedIn = useLoginStatus();
  const [isMounted, setIsMounted] = useState(false);
  const redirectTarget = useMemo(() => searchParams.get("redirect") || "/", [searchParams]);
  const reason = searchParams.get("reason") as LoginRequiredReason | null;
  const finishLogin = useCallback(() => {
    smartRouter.replace(redirectTarget.startsWith("/") ? redirectTarget : "/");
  }, [redirectTarget, smartRouter]);

  // 1. 处理密码或验证码提交
  const handleSubmit = async (phone: string, extra: string) => {
    setIsLoading(true);
    try {
      if (mode === "password") {
        const response = await loginByCellphone({ phone, password: extra });
        console.log("登录响应", response);
      } else if (mode === "sms") {
        const response = await loginByCellphone({ phone, captcha: extra });
        console.log("登录响应", response);
      }
    } catch (error) {
      console.error(error);
      toast.error(t("login.page.loginFailed"));
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

  if (isLoggedIn) {
    return <LoginSkeletonLoading />;
  }

  const showExitButton = isMounted && !runtime.isDesktop;

  return (
    <div
      className={cn(
        "bg-surface text-content flex min-h-screen w-screen flex-col items-center justify-center overflow-hidden p-4",
      )}
    >
      {/* 右上角退出按钮，点击返回主页 */}
      {showExitButton && (
        <button
          type="button"
          className="hover:bg-content/10 absolute top-5 right-6 rounded-full p-1 transition-colors"
          title={t("login.page.backHomeTitle")}
        >
          <Link href="/" className="flex items-center justify-center">
            <X className="text-content-subtle hover:text-content size-5 transition-colors" />
          </Link>
        </button>
      )}

      {/* 1. Logo 区域优化 */}
      <div className="mb-6 flex flex-col items-center">
        <div className="shadow-floating mb-3 flex size-14 items-center justify-center rounded-2xl bg-transparent text-3xl font-black">
          <Image src={logo.src} width={50} height={50} alt={t("login.logoAlt")} />
        </div>
        <p className="text-content-subtle text-xs font-medium">{t("login.page.tagline")}</p>
      </div>

      {/* 2. 主体宽度 */}
      <div className="w-full max-w-80">
        {reason && (
          <div className="mb-4">
            <LoginRequiredPrompt reason={reason} compact />
          </div>
        )}
        <Tabs value={mode} onValueChange={(v) => setMode(v as LoginMode)} className="w-full">
          {/* 3. Tab 切换器 */}
          <TabsList className="bg-content/5 border-content/5 mb-4 grid h-10 grid-cols-3 rounded-xl border p-1">
            <TabsTrigger
              value="qr"
              title={t("login.mode.qr")}
              className="data-[state=active]:bg-surface-elevated rounded-lg text-xs"
            >
              <QrCode className="mr-1 size-3.5" />
              {t("login.mode.qr")}
            </TabsTrigger>
            <TabsTrigger
              value="password"
              title={t("login.mode.password")}
              className="data-[state=active]:bg-surface-elevated rounded-lg text-xs"
            >
              <Lock className="mr-1 size-3.5" />
              {t("login.mode.password")}
            </TabsTrigger>
            <TabsTrigger
              value="sms"
              title={t("login.mode.sms")}
              className="data-[state=active]:bg-surface-elevated rounded-lg text-xs"
            >
              <Smartphone className="mr-1 size-3.5" />
              {t("login.mode.sms")}
            </TabsTrigger>
          </TabsList>

          {/* 4. 表单容器 */}
          <div className="bg-surface-raised shadow-floating border-content/5 rounded-2xl border p-5 backdrop-blur-xl">
            <TabsContent value="password" className="mt-0 outline-none">
              <PasswordLoginForm
                isLoading={isLoading}
                onSubmit={(phone, password) => handleSubmit(phone, password)}
              />
            </TabsContent>

            <TabsContent value="sms" className="mt-0 outline-none">
              <SmsLoginForm
                isLoading={isLoading}
                onSendCaptcha={handleSendCaptcha}
                onSubmit={(phone, captcha) => handleSubmit(phone, captcha)}
              />
            </TabsContent>

            <TabsContent value="qr" className="mt-0 outline-none">
              <QrLogin onSuccess={finishLogin} />
            </TabsContent>
          </div>
        </Tabs>

        {/* 底部文案 */}
        <p className="text-content-subtle mt-6 text-center text-[12px] font-medium">
          {t("login.page.qrOnlyNotice")}
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginSkeletonLoading />}>
      <HydrationGate>
        <LoginPageContent />
      </HydrationGate>
    </Suspense>
  );
}
