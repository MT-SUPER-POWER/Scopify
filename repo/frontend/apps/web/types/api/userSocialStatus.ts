export interface UserSocialStatusItem {
  id?: string | number;
  type?: number | string;
  iconUrl?: string;
  content?: string;
  actionUrl?: string;
  createTime?: number;
  updateTime?: number;
  userId?: number | string;
  [key: string]: unknown;
}

export interface UserSocialStatusResponse {
  code: number;
  data?: UserSocialStatusItem | null;
  message?: string;
  msg?: string;
}

export interface UserSocialStatusSupportItem {
  type: number | string;
  iconUrl?: string;
  content?: string;
  actionUrl?: string;
  name?: string;
  desc?: string;
  [key: string]: unknown;
}

export interface UserSocialStatusSupportResponse {
  code: number;
  data?: UserSocialStatusSupportItem[] | { list?: UserSocialStatusSupportItem[] };
  message?: string;
  msg?: string;
}

export interface UserSocialStatusRcmdUser {
  userId?: number | string;
  nickname?: string;
  avatarUrl?: string;
  signature?: string;
  status?: UserSocialStatusItem;
  [key: string]: unknown;
}

export interface UserSocialStatusRcmdResponse {
  code: number;
  data?:
    | {
        users?: UserSocialStatusRcmdUser[];
        hasMore?: boolean;
        count?: number;
        [key: string]: unknown;
      }
    | UserSocialStatusRcmdUser[];
  message?: string;
  msg?: string;
}

export interface UserSocialStatusEditParams {
  type?: number | string;
  iconUrl?: string;
  content?: string;
  actionUrl?: string;
}

export interface UserSocialStatusEditResponse {
  code: number;
  data?: unknown;
  message?: string;
  msg?: string;
}
