"use client";

import { Lock, QrCode, X } from "lucide-react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLoginFlow } from "@/hooks/auth/useLoginFlow";
import { useLoginPlatform } from "@/hooks/auth/useLoginPlatform";
import { runtime } from "@/lib/runtime";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

import type { LoginMode } from "@/types/auth/login";
import { LoginBrand } from "./LoginBrand";
import LoginSkeletonLoading from "./LoginSkeletonLoading";
import { PasswordLoginForm } from "./PasswordLoginForm";
import { LoginPlatformSwitch } from "./LoginPlatformSwitch";
import {
  LOGIN_BODY_CLASS_NAME,
  LOGIN_TAB_TRIGGER_CLASS_NAME,
  LOGIN_TABS_LIST_CLASS_NAME,
} from "./loginStyles";
import { QqQrLogin } from "./QqQrLogin";
import { QrLogin } from "./QrLogin";
import { LoginVerificationDialog } from "./LoginVerificationDialog";

export function LoginForm() {
  const { t } = useTranslation();
  const { platform, setPlatform } = useLoginPlatform();
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
  } = useLoginFlow(platform === "netease");

  if (isLoggedIn) {
    return <LoginSkeletonLoading />;
  }

  const isDesktop = isMounted && runtime.isDesktop;
  const showExitButton = isMounted && !runtime.isDesktop;
  const formContainerClassName = cn(
    "w-full max-w-sm rounded-3xl border border-content/5 bg-surface-raised p-6 shadow-floating backdrop-blur-xl",
    isDesktop &&
      "border-content/10 bg-surface-elevated shadow-panel dark:border-content/5 dark:bg-surface-raised dark:shadow-floating",
  );

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

      {/* 一张卡：顶部方式 tab → 内容 → 底部平台切换 */}
      <div className={formContainerClassName}>
        {platform === "qq" ? (
          <QqQrLogin onSuccess={finishLogin} />
        ) : (
          <Tabs value={mode} onValueChange={(v) => setMode(v as LoginMode)} className="w-full">
            <TabsList className={`${LOGIN_TABS_LIST_CLASS_NAME} grid-cols-2`}>
              <TabsTrigger
                disabled={isLoading || verification !== null}
                value="qr"
                title={t("login.mode.qr")}
                className={LOGIN_TAB_TRIGGER_CLASS_NAME}
              >
                <QrCode className="mr-1.5 size-3.5" />
                {t("login.mode.qr")}
              </TabsTrigger>
              <TabsTrigger
                disabled={isLoading || verification !== null}
                value="password"
                title={t("login.mode.password")}
                className={LOGIN_TAB_TRIGGER_CLASS_NAME}
              >
                <Lock className="mr-1.5 size-3.5" />
                {t("login.mode.password")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="qr" className={`${LOGIN_BODY_CLASS_NAME} outline-none`}>
              <QrLogin onSuccess={finishLogin} deviceName={deviceName} />
            </TabsContent>

            <TabsContent value="password" className={`${LOGIN_BODY_CLASS_NAME} outline-none`}>
              <PasswordLoginForm
                isLoading={isLoading}
                onSubmit={(phone, password, countrycode) =>
                  handleSubmit(phone, password, countrycode)
                }
              />
            </TabsContent>
          </Tabs>
        )}

        <div className="mt-5 border-t border-content/5 pt-3">
          <LoginPlatformSwitch
            value={platform}
            disabled={isLoading || verification !== null}
            onChange={setPlatform}
          />
        </div>
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
