"use client";
import { Input } from "@scopify/ui/shadcn/components/input";
import { Label } from "@scopify/ui/shadcn/components/label";
import { useI18n } from "@/store/module/i18n";
import type { LoginDeviceNameFieldProps } from "@/types/components/loginDevices";

export function LoginDeviceNameField({ value, onChange, disabled }: LoginDeviceNameFieldProps) {
  const { t } = useI18n();
  return (
    <div className="mb-5 space-y-2">
      <Label htmlFor="login-device-name">{t("devices.loginName")}</Label>
      <Input
        id="login-device-name"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        maxLength={80}
      />
      <p className="text-xs leading-relaxed text-muted-foreground">{t("devices.loginNameHint")}</p>
    </div>
  );
}
