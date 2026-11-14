import type { FreshLoginDevice } from "@/types/devices/model";

export interface YidunSession {
  sid: string;
  phone: string;
  countrycode?: string;
  device: FreshLoginDevice;
  captchaSentAt?: number;
}

export interface YidunResponse {
  code: number;
  msg?: string;
  message?: string;
  captchaId?: string;
  body?: {
    captchaId?: string;
    message?: string;
  };
  cookie?: string;
}

export interface YidunLoginParams {
  sid: string;
  phone: string;
  countrycode?: string;
  ctcode?: string;
  password?: string;
  captcha?: string;
  sca?: string;
}

export type YidunSendParams = Pick<
  YidunLoginParams,
  "sid" | "phone" | "sca" | "countrycode" | "ctcode"
>;

export interface YidunClientOptions {
  signal: AbortSignal;
  backend: string;
  verifySlider: (signal: AbortSignal, challenge: YidunResponse) => Promise<string>;
  onRetry?: () => void;
}

export type YidunVerificationStage = "loading" | "ready" | "retrying" | "sms" | "failed";

export interface YidunVerification {
  stage: YidunVerificationStage;
  message?: string;
}

export interface YidunSliderOptions {
  captchaId?: string;
  onReady?: () => void;
}

export interface YidunInstance {
  destroy: () => void;
}

export type InitNECaptcha = (
  options: {
    captchaId: string;
    element: HTMLElement;
    mode: "embed";
    width: string;
    lang: string;
    onVerify: (error: unknown, data?: { validate?: string; data?: { validate?: string } }) => void;
    onError: (error: unknown) => void;
  },
  onReady: (instance: YidunInstance) => void,
  onError: (error: unknown) => void,
) => void;
