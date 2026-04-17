"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
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
        <Label htmlFor="phone-sms" className="text-xs text-zinc-300">
          {t("login.form.phoneLabel")}
        </Label>
        <Input
          id="phone-sms"
          type="text"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder={t("login.form.phonePlaceholder")}
          className="bg-black/50 border-white/10 h-10 text-sm"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="captcha" className="text-xs text-zinc-300">
          {t("login.form.captchaLabel")}
        </Label>
        <div className="flex gap-2">
          <Input
            id="captcha"
            type="text"
            value={captcha}
            onChange={(e) => setCaptcha(e.target.value)}
            placeholder={t("login.form.captchaPlaceholder")}
            className="bg-black/50 border-white/10 h-10 text-sm"
          />
          <Button
            type="button"
            variant="outline"
            onClick={handleSendCaptcha}
            disabled={countdown > 0}
            className="shrink-0 border-white/10 text-white hover:bg-white/5 font-bold h-10 px-3 rounded-md transition-colors text-xs disabled:opacity-50"
          >
            {countdown > 0 ? `${countdown}s` : t("login.form.getCaptcha")}
          </Button>
        </div>
      </div>
      <Button
        type="submit"
        disabled={isLoading}
        className="w-full bg-[#1db954] hover:bg-[#1ed760] text-black font-bold h-10 rounded-full transition-all hover:scale-[1.02] active:scale-95 mt-2"
      >
        {isLoading ? t("login.form.verifying") : t("login.form.verifyAndLogin")}
      </Button>
    </form>
  );
}
