"use client";

import { Lock, QrCode, X } from "lucide-react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLoginFlow } from "@/hooks/auth/useLoginFlow";
import { runtime } from "@/lib/runtime";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

import type { LoginMode } from "@/types/auth/login";
import { LoginBrand } from "./LoginBrand";
import LoginSkeletonLoading from "./LoginSkeletonLoading";
import { PasswordLoginForm } from "./PasswordLoginForm";
import { QrLogin } from "./QrLogin";
import { LoginVerificationDialog } from "./LoginVerificationDialog";

export function LoginForm() {
  const { t } = useTranslation();
  const {
    mode,
    setMode,
    setSliderHost,
    verification,
    smsSession,
    cancelVerification,
    isLoading,
    deviceName,
    isLoggedIn,
    isMounted,
    finishLogin,
    handleSubmit,
    handleSendCaptcha,
    handleSubmitCaptcha,
  } = useLoginFlow();

  if (isLoggedIn) {
    return <LoginSkeletonLoading />;
  }

  const isDesktop = isMounted && runtime.isDesktop;
  const showExitButton = isMounted && !runtime.isDesktop;

  return (
    <>
      {/* 右上角退出按钮，点击返回主页 */}
      {showExitButton && (
        <button
          type="button"
          className="absolute top-5 right-6 rounded-full p-1 transition-colors hover:bg-content/10"
          title={t("login.page.backHomeTitle")}
        >
          <Link href="/" className="flex items-center justify-center">
            <X className="size-5 text-content-subtle transition-colors hover:text-content" />
          </Link>
        </button>
      )}

      <LoginBrand />

      {/* 2. 主体宽度 */}
      <div className="w-full max-w-80">
        <Tabs value={mode} onValueChange={(v) => setMode(v as LoginMode)} className="w-full">
          {/* 3. Tab 切换器 */}
          <TabsList className="mb-4 grid h-10 grid-cols-2 rounded-xl border border-content/5 bg-content/5 p-1">
            <TabsTrigger
              disabled={isLoading || verification !== null}
              value="qr"
              title={t("login.mode.qr")}
              className="rounded-lg text-xs data-[state=active]:bg-surface-elevated"
            >
              <QrCode className="mr-1 size-3.5" />
              {t("login.mode.qr")}
            </TabsTrigger>
            <TabsTrigger
              disabled={isLoading || verification !== null}
              value="password"
              title={t("login.mode.password")}
              className="rounded-lg text-xs data-[state=active]:bg-surface-elevated"
            >
              <Lock className="mr-1 size-3.5" />
              {t("login.mode.password")}
            </TabsTrigger>
          </TabsList>

          {/* 4. 表单容器 */}
          <div
            className={cn(
              "rounded-2xl border border-content/5 bg-surface-raised p-5 shadow-floating backdrop-blur-xl",
              isDesktop &&
                "border-content/10 bg-surface-elevated shadow-panel dark:border-content/5 dark:bg-surface-raised dark:shadow-floating",
            )}
          >
            <TabsContent value="password" className="mt-0 outline-none">
              <PasswordLoginForm
                isLoading={isLoading}
                onSubmit={(phone, password, countrycode) =>
                  handleSubmit(phone, password, countrycode)
                }
              />
            </TabsContent>

            <TabsContent value="qr" className="mt-0 outline-none">
              <QrLogin onSuccess={finishLogin} deviceName={deviceName} />
            </TabsContent>
          </div>
        </Tabs>
      </div>

      <LoginVerificationDialog
        verification={verification}
        onHostChange={setSliderHost}
        onCancel={cancelVerification}
        smsSession={smsSession}
        isLoading={isLoading}
        onSendCaptcha={handleSendCaptcha}
        onSubmitCaptcha={handleSubmitCaptcha}
      />
    </>
  );
}
