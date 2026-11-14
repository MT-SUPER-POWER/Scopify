"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { Button } from "@scopify/ui/shadcn/components/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { CountryCodeSelect } from "./CountryCodeSelect";
import {
  CAPTCHA_VALIDITY_MS,
  validateCaptcha,
  validatePhoneNumber,
} from "@/lib/auth/authValidator";
import type { SmsLoginFormProps } from "@/types/auth/login";

export function SmsLoginForm({
  isLoading,
  captchaSentAt,
  phone,
  countryCode = "86",
  onSendCaptcha,
  onSubmit,
}: SmsLoginFormProps) {
  const [captcha, setCaptcha] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [expiredSentAt, setExpiredSentAt] = useState<number | null>(null);
  const { t } = useTranslation();
  const hasCaptcha = captchaSentAt !== undefined;
  const isExpired = hasCaptcha && expiredSentAt === captchaSentAt;
  const phoneCheck = validatePhoneNumber(phone, countryCode);
  const canSubmit =
    !isLoading && hasCaptcha && !isExpired && phoneCheck.valid && validateCaptcha(captcha).valid;
  const captchaHint = !hasCaptcha
    ? t("login.page.pleaseSendCaptchaFirst")
    : isExpired
      ? t("login.page.captchaExpired")
      : t("login.page.invalidCaptchaLength");

  useEffect(() => {
    if (captchaSentAt === undefined) return;
    const expiresIn = Math.max(0, captchaSentAt + CAPTCHA_VALIDITY_MS - Date.now());
    const timer = setTimeout(() => setExpiredSentAt(captchaSentAt), expiresIn);
    return () => clearTimeout(timer);
  }, [captchaSentAt]);

  const handleSendCaptcha = async () => {
    if (isLoading || countdown > 0) return;
    if (!phoneCheck.valid) {
      toast.warning(phoneCheck.message);
      return;
    }
    const success = await onSendCaptcha();
    if (success) {
      setCaptcha("");
      setCountdown(60);
    }
  };

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || captchaSentAt === undefined) return;
    if (Date.now() - captchaSentAt >= CAPTCHA_VALIDITY_MS) {
      setExpiredSentAt(captchaSentAt);
      return;
    }
    void onSubmit(captcha.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="phone-sms" className="text-xs text-content-muted">
          {t("login.form.phoneLabel")}
        </Label>
        <div className="flex gap-2">
          <CountryCodeSelect value={countryCode} onChange={() => undefined} disabled />
          <Input
            id="phone-sms"
            type="tel"
            autoComplete="tel"
            disabled
            value={phone}
            placeholder={t("login.form.phonePlaceholder")}
            className="h-10 flex-1 border-content/10 bg-content/5 text-sm text-content"
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="captcha" className="text-xs text-content-muted">
          {t("login.form.captchaLabel")}
        </Label>
        <div className="flex gap-2">
          <Input
            id="captcha"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            aria-describedby="sms-captcha-hint"
            disabled={isLoading || !hasCaptcha || isExpired}
            value={captcha}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, "").slice(0, 4);
              setCaptcha(value);
            }}
            placeholder={t("login.form.captchaPlaceholder")}
            className="h-10 border-content/10 bg-content/5 text-sm text-content"
          />
          <Button
            type="button"
            variant="outline"
            onClick={handleSendCaptcha}
            disabled={isLoading || !phone.trim() || countdown > 0}
            className="h-10 shrink-0 rounded-md border-content/10 px-3 text-xs font-bold text-content transition-colors hover:bg-content/5 disabled:opacity-50"
          >
            {countdown > 0 ? `${countdown}s` : t("login.form.getCaptcha")}
          </Button>
        </div>
        <p id="sms-captcha-hint" role="status" className="text-xs text-content-muted">
          {captchaHint}
        </p>
      </div>
      <Button
        type="submit"
        disabled={!canSubmit}
        className="hover:scale-1.02 mt-2 h-10 w-full rounded-full bg-brand font-bold text-brand-foreground transition-all hover:bg-brand-hover active:scale-95 disabled:opacity-50"
      >
        {isLoading ? t("login.form.verifying") : t("login.form.verifyAndLogin")}
      </Button>
    </form>
  );
}
