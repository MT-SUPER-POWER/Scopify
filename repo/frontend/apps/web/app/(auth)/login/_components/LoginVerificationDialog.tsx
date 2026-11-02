"use client";

import { LoaderCircle, ShieldCheck, TriangleAlert } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { LoginVerificationDialogProps } from "@/types/auth/login";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@scopify/ui/shadcn/components/dialog";
import { SmsLoginForm } from "./SmsLoginForm";

export function LoginVerificationDialog({
  verification,
  onHostChange,
  onCancel,
  smsSession,
  isLoading,
  onSendCaptcha,
  onSubmitCaptcha,
}: LoginVerificationDialogProps) {
  const { t } = useTranslation();
  const stage = verification?.stage ?? "loading";
  const descriptions = {
    loading: t("login.page.securityLoading"),
    ready: t("login.page.sliderVerificationDescription"),
    retrying: t("login.page.securitySubmitting"),
    failed: t("login.page.securityRetryHint"),
    sms: t("login.page.secondaryVerification"),
  };

  return (
    <Dialog
      open={verification !== null}
      onOpenChange={(open) => {
        if (!open) {
          onCancel();
        }
      }}
    >
      <DialogContent
        className="w-100 max-w-[92vw] rounded-2xl border border-content/10 bg-surface-elevated p-6 shadow-panel"
        onPointerDownOutside={(event) => event.preventDefault()}
      >
        <DialogHeader className="space-y-1.5 text-center">
          <DialogTitle className="text-base font-semibold text-content">
            {stage === "sms"
              ? t("login.page.secondaryVerificationTitle")
              : t("login.page.securityVerification")}
          </DialogTitle>
          <DialogDescription className="text-xs text-content-subtle">
            {descriptions[stage]}
          </DialogDescription>
        </DialogHeader>

        {smsSession && (
          <div hidden={stage !== "sms"}>
            <SmsLoginForm
              key={smsSession.sid}
              initialPhone={smsSession.phone}
              initialCountryCode={smsSession.countrycode}
              isLoading={isLoading}
              onSendCaptcha={onSendCaptcha}
              onSubmit={(_, captcha) => onSubmitCaptcha(captcha)}
            />
            {stage === "sms" && verification?.message && (
              <p role="alert" className="mt-3 text-sm text-content-muted">
                {verification.message}
              </p>
            )}
          </div>
        )}

        {stage !== "sms" && (
          <div
            className="relative my-2 flex min-h-[190px] min-w-0 items-center justify-center rounded-xl bg-surface/50"
            aria-busy={stage === "loading" || stage === "retrying"}
          >
            <div
              ref={onHostChange}
              className="min-h-[190px] w-full max-w-80"
              hidden={stage === "failed"}
            />
            {stage !== "ready" && (
              <div
                role={stage === "failed" ? "alert" : "status"}
                className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-xl bg-surface-elevated px-4 text-center text-sm text-content-muted"
              >
                {stage === "failed" ? (
                  <TriangleAlert className="size-7" aria-hidden="true" />
                ) : stage === "retrying" ? (
                  <ShieldCheck className="size-7" aria-hidden="true" />
                ) : (
                  <LoaderCircle
                    className="size-7 animate-spin motion-reduce:animate-none"
                    aria-hidden="true"
                  />
                )}
                <p>
                  {stage === "failed"
                    ? verification?.message || t("login.page.securityFailed")
                    : descriptions[stage]}
                </p>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-center pt-1">
          <button
            type="button"
            onClick={onCancel}
            className="text-xs text-content-muted transition-colors hover:text-content hover:underline"
          >
            {stage === "failed"
              ? t("login.page.securityBackToLogin")
              : t("login.page.cancelVerification")}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
