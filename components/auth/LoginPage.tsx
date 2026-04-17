"use client";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ PACKAGE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { Lock, QrCode, Smartphone, X } from "lucide-react";
import Link from "next/link";
import type React from "react";
import { Suspense, useEffect, useState } from "react";
import { toast } from "sonner";
import { PasswordLoginForm } from "@/components/Login/PasswordLoginForm";
import { QrLogin } from "@/components/Login/QrLogin";
import { SmsLoginForm } from "@/components/Login/SmsLoginForm";
import LoginSkeletonLoading from "@/components/auth/LoginSkeletonLoading";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { loginByCellphone } from "@/lib/api/login";
import { useLoginStatus } from "@/lib/hooks/useLoginStatus";
import { useSmartRouter } from "@/lib/hooks/useSmartRouter";
import { cn, IS_WEB } from "@/lib/utils";
import { sendCaptcha } from "@/lib/web/auth";
import { useI18n } from "@/store/module/i18n";
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
  const { t } = useI18n();
  const [mode, setMode] = useState<LoginMode>("qr");
  const [isLoading, setIsLoading] = useState(false);

  const isLoggedIn = useLoginStatus();
  const [isMounted, setIsMounted] = useState(false);

  // 1. 处理密码或验证码提交
  const handleSubmit = async (phone: string, extra: string) => {
    setIsLoading(true);
    try {
      let res: any;
      if (mode === "password") {
        res = await loginByCellphone({ phone, password: extra });
      } else if (mode === "sms") {
        res = await loginByCellphone({ phone, captcha: extra });
      }
      console.log("登录响应", res);
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
    if (isLoggedIn) smartRouter.replace("/");
  }, [isLoggedIn, smartRouter]);

  useEffect(() => {
    // 组件挂载后标记为 true
    setIsMounted(true);
    if (isLoggedIn) smartRouter.replace("/");
  }, [isLoggedIn, smartRouter]);

  if (isLoggedIn) {
    return <LoginSkeletonLoading />;
  }

  const showExitButton = isMounted && IS_WEB;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center bg-black text-white p-4 min-h-screen w-screen overflow-hidden",
      )}
    >
      {/* 右上角退出按钮，点击返回主页 */}
      {showExitButton && (
        <button
          type="button"
          className="absolute top-5 right-6 p-1 rounded-full hover:bg-white/10 transition-colors"
          title={t("login.page.backHomeTitle")}
        >
          <Link href="/" className="flex items-center justify-center">
            <X className="w-5 h-5 text-zinc-500 hover:text-white transition-colors" />
          </Link>
        </button>
      )}

      {/* 1. Logo 区域优化 */}
      <div className="mb-6 flex flex-col items-center">
        <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mb-3 text-black font-black text-3xl shadow-2xl">
          S
        </div>
        <p className="text-zinc-500 text-xs font-medium">{t("login.page.tagline")}</p>
      </div>

      {/* 2. 主体宽度 */}
      <div className="w-full max-w-[320px]">
        <Tabs value={mode} onValueChange={(v) => setMode(v as LoginMode)} className="w-full">
          {/* 3. Tab 切换器 */}
          <TabsList className="grid grid-cols-3 mb-4 bg-zinc-900/60 border border-white/5 rounded-xl h-10 p-1">
            <TabsTrigger
              value="qr"
              title={t("login.mode.qr")}
              className="text-xs data-[state=active]:bg-zinc-800 rounded-lg"
            >
              <QrCode className="w-3.5 h-3.5 mr-1" />
              {t("login.mode.qr")}
            </TabsTrigger>
            <TabsTrigger
              value="password"
              title={t("login.mode.password")}
              className="text-xs data-[state=active]:bg-zinc-800 rounded-lg"
            >
              <Lock className="w-3.5 h-3.5 mr-1" />
              {t("login.mode.password")}
            </TabsTrigger>
            <TabsTrigger
              value="sms"
              title={t("login.mode.sms")}
              className="text-xs data-[state=active]:bg-zinc-800 rounded-lg"
            >
              <Smartphone className="w-3.5 h-3.5 mr-1" />
              {t("login.mode.sms")}
            </TabsTrigger>
          </TabsList>

          {/* 4. 表单容器 */}
          <div className="bg-zinc-900/30 p-5 rounded-2xl border border-white/5 backdrop-blur-xl shadow-2xl">
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
              <QrLogin />
            </TabsContent>
          </div>
        </Tabs>

        {/* 底部文案 */}
        <p className="mt-6 text-center text-[12px] text-zinc-600 font-medium">
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
