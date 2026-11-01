"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { Button } from "@scopify/ui/shadcn/components/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslation } from "react-i18next";

import type { SmsLoginFormProps } from "@/types/auth/login";

export function SmsLoginForm({
  isLoading,
  initialPhone = "",
  onSendCaptcha,
  onSubmit,
}: SmsLoginFormProps) {
  const [phone, setPhone] = useState(initialPhone);
  const [captcha, setCaptcha] = useState("");
  const [countdown, setCountdown] = useState(0);
  const { t } = useTranslation();

  const handleSendCaptcha = async () => {
    if (!phone || isLoading || countdown > 0) return;
    const success = await onSendCaptcha(phone);
    if (success) {
      setCountdown(60);
    }
  };

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone && captcha) {
      onSubmit(phone, captcha);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="phone-sms" className="text-xs text-content-muted">
          {t("login.form.phoneLabel")}
        </Label>
        <Input
          id="phone-sms"
          type="tel"
          autoComplete="tel"
          disabled={isLoading || !!initialPhone}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder={t("login.form.phonePlaceholder")}
          className="h-10 border-content/10 bg-content/5 text-sm text-content"
        />
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
            disabled={isLoading}
            value={captcha}
            onChange={(e) => setCaptcha(e.target.value)}
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
      </div>
      <Button
        type="submit"
        disabled={isLoading}
        className="hover:scale-1.02 mt-2 h-10 w-full rounded-full bg-brand font-bold text-brand-foreground transition-all hover:bg-brand-hover active:scale-95"
      >
        {isLoading ? t("login.form.verifying") : t("login.form.verifyAndLogin")}
      </Button>
    </form>
  );
}
