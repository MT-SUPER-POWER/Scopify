"use client";

import React, { useState, useEffect } from 'react';
import { Smartphone } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SmsLoginFormProps {
  isLoading: boolean;
  onSendCaptcha: (phone: string) => Promise<boolean>;
  onSubmit: (phone: string, captcha: string) => void;
}

export function SmsLoginForm({ isLoading, onSendCaptcha, onSubmit }: SmsLoginFormProps) {
  const [phone, setPhone] = useState('');
  const [captcha, setCaptcha] = useState('');
  const [countdown, setCountdown] = useState(0);

  const handleSendCaptcha = async () => {
    if (!phone || countdown > 0) return;
    const success = await onSendCaptcha(phone);
    if (success) {
      setCountdown(60);
    }
  };

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown(c => c - 1), 1000);
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
        <Label htmlFor="phone-sms" className="text-xs text-zinc-300">手机号码</Label>
        <Input
          id="phone-sms"
          type="text"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          placeholder="请输入手机号"
          className="bg-black/50 border-white/10 h-10 text-sm"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="captcha" className="text-xs text-zinc-300">验证码</Label>
        <div className="flex gap-2">
          <Input
            id="captcha"
            type="text"
            value={captcha}
            onChange={e => setCaptcha(e.target.value)}
            placeholder="4 位验证码"
            className="bg-black/50 border-white/10 h-10 text-sm"
          />
          <Button
            type="button"
            variant="outline"
            onClick={handleSendCaptcha}
            disabled={countdown > 0}
            className="shrink-0 border-white/10 text-white hover:bg-white/5 font-bold h-10 px-3 rounded-md transition-colors text-xs disabled:opacity-50"
          >
            {countdown > 0 ? `${countdown}s` : '获取验证码'}
          </Button>
        </div>
      </div>
      <Button
        type="submit"
        disabled={isLoading}
        className="w-full bg-[#1db954] hover:bg-[#1ed760] text-black font-bold h-10 rounded-full transition-all hover:scale-[1.02] active:scale-95 mt-2"
      >
        {isLoading ? '验证中...' : '验证并登录'}
      </Button>
    </form>
  );
}
