import type { FreshLoginDevice } from "@/types/devices/model";

export interface YidunSession {
  sid: string;
  phone: string;
  device: FreshLoginDevice;
}

export interface YidunResponse {
  code: number;
  msg?: string;
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
