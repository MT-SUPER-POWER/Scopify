"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { Button } from "@scopify/ui/shadcn/components/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/store/module/i18n";

interface SmsLoginFormProps {
  isLoading: boolean;
  onSendCaptcha: (phone: string) => Promise<boolean>;
  onSubmit: (phone: string, captcha: string) => void;
}

export function SmsLoginForm({ isLoading, onSendCaptcha, onSubmit }: SmsLoginFormProps) {
  const [phone, setPhone] = useState("");
  const [captcha, setCaptcha] = useState("");
  const [countdown, setCountdown] = useState(0);
  const { t } = useI18n();

  const handleSendCaptcha = async () => {
    if (!phone || countdown > 0) return;
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
          type="text"
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
            value={captcha}
            onChange={(e) => setCaptcha(e.target.value)}
            placeholder={t("login.form.captchaPlaceholder")}
            className="h-10 border-content/10 bg-content/5 text-sm text-content"
          />
          <Button
            type="button"
            variant="outline"
            onClick={handleSendCaptcha}
            disabled={countdown > 0}
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
