export type LoginRequiredReason =
  | "album-subscribe"
  | "playlist-edit"
  | "profile-edit"
  | "comment"
  | "add-to-playlist"
  | "library"
  | "followed-artists";

export interface LoginRequiredPromptProps {
  reason: LoginRequiredReason;
  onLogin?: () => void;
  compact?: boolean;
}

export type LoginType = "token" | "cookie" | "qr" | "uid" | null;

export interface AuthStatus {
  /**
   * 是否为正式认证登录用户（核心评判字段）
   * 必须同时具备：有效会话 Cookie (hasCredential) + 合法用户画像 (hasUser)
   */
  isAuthenticated: boolean;

  /**
   * 是否处于 UID 只读访客模式
   * 特征：本地有用户画像，但没有网易云 Cookie 凭据（禁止私信、通知中心、写操作）
   */
  isGuest: boolean;

  /**
   * 是否为完全未登录的匿名用户
   * 特征：既无凭证也无用户画像
   */
  isAnonymous: boolean;

  /** 本地是否持有非空的网易云会话 Cookie 凭据 */
  hasCredential: boolean;

  /** 本地是否持有合法的用户画像 */
  hasUser: boolean;

  /** 用户数字 ID（无有效用户时为 null） */
  userId: number | null;

  /** 字符串格式用户 ID（专供通知中心、私信中心及路由使用） */
  accountId: string | null;

  /** 用户完整资料对象 */
  user: import("@/types/api/user").NeteaseUser | null;

  /** 登录方式元数据（仅作信息展示，不参与鉴权判定） */
  loginType: LoginType;
}
