"use client";

import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PasswordLoginFormProps {
  isLoading: boolean;
  onSubmit: (phone: string, password: string) => void;
}

export function PasswordLoginForm({ isLoading, onSubmit }: PasswordLoginFormProps) {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone && password) {
      onSubmit(phone, password);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="phone" className="text-xs text-zinc-300">手机号码</Label>
        <Input
          id="phone"
          type="text"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          placeholder="请输入手机号"
          className="bg-black/50 border-white/10 h-10 text-sm"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password" className="text-xs text-zinc-300">密码</Label>
        <div className="relative group">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="请输入密码"
            className="bg-black/50 border-white/10 h-10 pr-10 text-sm"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors outline-none"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>
      <Button
        type="submit"
        disabled={isLoading}
        className="w-full bg-[#1db954] hover:bg-[#1ed760] text-black font-bold h-10 rounded-full transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 mt-2"
      >
        {isLoading ? '登录中...' : '登录'}
      </Button>
    </form>
  );
}
