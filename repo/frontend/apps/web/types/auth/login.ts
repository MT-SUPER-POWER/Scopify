import type { ReactNode } from "react";
import type { YidunSession, YidunVerification } from "@/types/auth/yidun";

export interface LoginVerificationDialogProps {
  verification: YidunVerification | null;
  onHostChange: (host: HTMLDivElement | null) => void;
  onCancel: () => void;
  smsSession: Pick<YidunSession, "sid" | "phone" | "countrycode" | "captchaSentAt"> | null;
  isLoading: boolean;
  onSendCaptcha: () => Promise<boolean>;
  onSubmitCaptcha: (captcha: string) => Promise<void>;
}

export type LoginMode = "password" | "qr";

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
  captchaSentAt?: number;
  isLoading: boolean;
  phone: string;
  countryCode?: string;
  onSendCaptcha: () => Promise<boolean>;
  onSubmit: (captcha: string) => Promise<void>;
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
