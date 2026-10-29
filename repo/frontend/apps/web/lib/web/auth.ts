import request from "@/lib/web/request";
import { clearMusicSessionCredential } from "@/lib/web/musicSessionCredential";
import type { NeteaseUser } from "@/types/user/api";

const PLACEHOLDER_NICKNAMES = new Set(["未知用户", "未知使用者", "Unknown User"]);

export function isRealUser(
  user: { userId?: number; nickname?: string } | null | undefined,
): boolean {
  if (!user || typeof user.userId !== "number" || user.userId <= 0) return false;
  if (!user.nickname || typeof user.nickname !== "string") return false;
  const trimmed = user.nickname.trim();
  if (!trimmed || PLACEHOLDER_NICKNAMES.has(trimmed)) return false;
  return true;
}

export interface LoginInfo {
  isLoggedIn: boolean;
  loginType: "token" | "cookie" | "qr" | "uid" | null;
  hasToken: boolean;
  hasUser: boolean;
  user: NeteaseUser | null;
}

/**
 * 发送验证码到指定号码的手机
 * @param phone 手机号
 * @param ctcode 国家区号，默认86
 */
export function sendCaptcha(phone: string, ctcode: string | number = 86) {
  return request.get("/captcha/sent", { params: { phone, ctcode } });
}

/**
 * 校验验证码
 * @param phone 手机号
 * @param captcha 验证码
 * @param ctcode 国家区号，默认86
 */
export function verifyCaptcha(
  phone: string,
  captcha: string | number,
  ctcode: string | number = 86,
) {
  return request.get("/captcha/verify", { params: { phone, captcha, ctcode } });
}

/**
 * 清除登录状态
 */
export function clearLoginStatus(): void {
  clearMusicSessionCredential();
  localStorage.removeItem("user_id");
}
