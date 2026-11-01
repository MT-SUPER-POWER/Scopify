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
  onSubmit: (phone: string, password: string) => void;
}

export interface SmsLoginFormProps {
  isLoading: boolean;
  initialPhone?: string;
  onSendCaptcha: (phone: string) => Promise<boolean>;
  onSubmit: (phone: string, captcha: string) => void;
}
