"use client";

import { Eye, EyeOff } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { Button } from "@scopify/ui/shadcn/components/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslation } from "react-i18next";

import type { PasswordLoginFormProps } from "@/types/auth/login";

export function PasswordLoginForm({ isLoading, onSubmit }: PasswordLoginFormProps) {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { t } = useTranslation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone && password) {
      onSubmit(phone, password);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="phone" className="text-xs text-content-muted">
          {t("login.form.phoneLabel")}
        </Label>
        <Input
          id="phone"
          type="tel"
          autoComplete="tel"
          disabled={isLoading}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder={t("login.form.phonePlaceholder")}
          className="h-10 border-content/10 bg-content/5 text-sm text-content"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password" className="text-xs text-content-muted">
          {t("login.form.passwordLabel")}
        </Label>
        <div className="group relative">
          <Input
            id="password"
            autoComplete="current-password"
            disabled={isLoading}
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t("login.form.passwordPlaceholder")}
            className="h-10 border-content/10 bg-content/5 pr-10 text-sm text-content"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={t("login.form.passwordLabel")}
            aria-pressed={showPassword}
            className="absolute top-1/2 right-3 -translate-y-1/2 text-content-subtle transition-colors outline-none hover:text-content"
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </div>
      <Button
        type="submit"
        disabled={isLoading}
        className="hover:scale-1.02 mt-2 h-10 w-full rounded-full bg-brand font-bold text-brand-foreground transition-all hover:bg-brand-hover active:scale-95 disabled:opacity-50"
      >
        {isLoading ? t("login.form.passwordSubmitting") : t("login.form.passwordSubmit")}
      </Button>
    </form>
  );
}
