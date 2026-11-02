import type { ReactNode } from "react";

export type LoginMode = "password" | "sms" | "qr";

export type QrStatus = "expired" | "loading" | "scanned" | "success" | "waiting";

export interface QrLoginProps {
  onSuccess?: () => void;
  deviceName?: string;
}

export interface LoginHydrationGateProps {
  children: ReactNode;
}

export interface PasswordLoginFormProps {
  isLoading: boolean;
  onSubmit: (phone: string, password: string, countrycode?: string) => void;
}

export interface SmsLoginFormProps {
  isLoading: boolean;
  initialPhone?: string;
  initialCountryCode?: string;
  onSendCaptcha: (phone: string, countrycode?: string) => Promise<boolean>;
  onSubmit: (phone: string, captcha: string, countrycode?: string) => void;
}

export interface CountryCodeItem {
  code: string;
  nameZh: string;
  nameEn: string;
  flag: string;
  popular?: boolean;
}

export interface CountryCodeSelectProps {
  value: string;
  onChange: (code: string) => void;
  disabled?: boolean;
}
