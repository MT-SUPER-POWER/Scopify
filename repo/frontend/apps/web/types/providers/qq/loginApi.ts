/** Which app scans the QR: mobile QQ, WeChat, or the QQ Music app. */
export type QqLoginChannel = "qq" | "wechat" | "qqmusic";

/** GET /login/qr/key */
export interface QqQrKeyDto {
  code: number;
  data: { unikey: string };
}

/** GET /login/qr/create */
export interface QqQrCreateDto {
  code: number;
  data: { qrimg: string };
}

/**
 * GET /login/qr/check: 800 expired, 801 waiting, 802 scanned, 803 confirmed. On 803 `cookie` is
 * `qqmusic_session=<token>`, the session later requests send back.
 */
export interface QqQrCheckDto {
  code: 800 | 801 | 802 | 803;
  message: string;
  cookie?: string;
  retryAfterMs?: number;
}

/**
 * The public profile `/login/status` answers with: identity fields from the credential, plus
 * the upstream `GetLoginUserInfo` reply whose account fields sit under `info`.
 */
export interface QqLoginProfileDto {
  musicid?: number | string;
  str_musicid?: string;
  nickname?: string;
  nick?: string;
  avatarUrl?: string;
  info?: {
    nick?: string;
    logo?: string;
    headpic?: string;
  };
}

/** GET /login/status always answers 200; `data.profile` is missing when the session is not valid. */
export interface QqLoginStatusDto {
  code: number;
  data: { profile?: QqLoginProfileDto };
}
