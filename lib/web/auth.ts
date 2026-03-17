import request from "@/lib/web/request";
import { useUserStore } from "@/store";

export interface LoginInfo {
  isLoggedIn: boolean;
  loginType: 'token' | 'cookie' | 'qr' | 'uid' | null;
  hasToken: boolean;
  hasUser: boolean;
  user: any;
}

/**
 * 发送验证码到指定号码的手机
 * @param phone 手机号
 * @param ctcode 国家区号，默认86
 */
export function sendCaptcha(phone: string, ctcode: string | number = 86) {
  return request.get('/captcha/sent', { params: { phone, ctcode } });
}

/**
 * 校验验证码
 * @param phone 手机号
 * @param captcha 验证码
 * @param ctcode 国家区号，默认86
 */
export function verifyCaptcha(phone: string, captcha: string | number, ctcode: string | number = 86) {
  return request.get('/captcha/verify', { params: { phone, captcha, ctcode } });
}

/**
 * 清除登录状态
 */
export function clearLoginStatus(): void {
  localStorage.removeItem('token');
  localStorage.removeItem('cookie');
  useUserStore.getState().setUserId("");
}
