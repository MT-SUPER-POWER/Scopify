import request from "../web/request";

/**
 * 手机号登录
 * @param countrycode 国家码，用于国外手机号登录，例如美国传入：1
 * @returns Promise<any>
 */
export function loginByCellphone(params: {
  phone: string;
  password?: string;
  md5_password?: string;
  captcha?: string;
  countrycode?: string | number;
}) {
  return request.get('/login/cellphone', { params });
}

/**
 * 退出当前的登录状态
 */
export function logout() {
  return request.get('/logout');
}

// 获取当前登录状态（可传入 cookie）
export function getLoginStatus(cookie = '') {
  return request.post('/login/status', { cookie }, { params: { timestamp: Date.now(), ua: 'pc' } });
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 二维码登录 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// 创建二维码key
export function getQRKey() {
  return request.get('/login/qr/key', { params: { timestamp: Date.now() } });
}

// 创建二维码（qrimg=true 直接返回 base64 图片）
export function createQR(key: string) {
  return request.get('/login/qr/create', {
    params: { key, qrimg: true, platform: 'web', ua: 'pc', timestamp: Date.now() }
  });
}

// 获取二维码扫码状态
export function checkQR(key: string) {
  return request.get('/login/qr/check', {
    params: { key, ua: 'pc', timestamp: Date.now() }
  });
}
