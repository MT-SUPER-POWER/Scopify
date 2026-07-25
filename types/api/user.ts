export interface IUserDetail {
  level: number;
  listenSongs: number;
  userPoint: UserPoint;
  mobileSign: boolean;
  pcSign: boolean;
  profile: Profile;
  peopleCanSeeMyPlayRecord: boolean;
  bindings: Binding[];
  adValid: boolean;
  code: number;
  createTime: number;
  createDays: number;
  profileVillageInfo: ProfileVillageInfo;
}

/** The authenticated account payload returned by `GET /user/account`. */
export interface UserAccount {
  id: number;
  userName: string;
  type: number;
  status: number;
  whitelistAuthority: number;
  createTime: number;
  tokenVersion: number;
  ban: number;
  baoyueVersion: number;
  donateVersion: number;
  vipType: number;
  anonimousUser: boolean;
  paidFee: boolean;
}

/** The authenticated profile projection returned by `GET /user/account`. */
export interface UserAccountProfile {
  userId: number;
  userType: number;
  nickname: string;
  avatarImgId: number;
  avatarUrl: string;
  backgroundImgId: number;
  backgroundUrl: string;
  signature: string;
  createTime: number;
  userName: string;
  accountType: number;
  shortUserName: string;
  birthday: number;
  authority: number;
  gender: number;
  accountStatus: number;
  province: number;
  city: number;
  authStatus: number;
  description: null | string;
  detailDescription: null | string;
  defaultAvatar: boolean;
  expertTags: null | string[];
  experts: NeteaseExpertMap | null;
  djStatus: number;
  locationStatus: number;
  vipType: number;
  followed: boolean;
  mutual: boolean;
  authenticated: boolean;
  lastLoginTime: number;
  lastLoginIP: string;
  remarkName: null | string;
  viptypeVersion: number;
  authenticationTypes: number;
  avatarDetail: NeteaseAvatarDetail | null;
  anchor: boolean;
}

export interface UserAccountResponse {
  code: number;
  account?: UserAccount;
  profile?: UserAccountProfile;
}

/**
 * The verified success branch of `GET /user/account`.
 *
 * The endpoint can return an authentication failure as an HTTP 200 response,
 * so callers must verify `code` before relying on account or profile fields.
 */
export interface UserAccountSuccessResponse extends UserAccountResponse {
  code: 200;
  account: UserAccount;
  profile: UserAccountProfile;
}

export interface IUserFollow {
  followed: boolean;
  follows: boolean;
  nickname: string;
  avatarUrl: string;
  userId: number;
  gender: number;
  signature: string;
  backgroundUrl: string;
  vipType: number;
  userType: number;
  accountType: number;
}

export interface UserFollowsResponse {
  follow: IUserFollow[];
  more: boolean;
}

interface ProfileVillageInfo {
  title: string;
  imageUrl?: null | string;
  targetUrl: string;
}

interface Binding {
  userId: number;
  url: string;
  expiresIn: number;
  refreshTime: number;
  bindingTime: number;
  tokenJsonStr?: null | string;
  expired: boolean;
  id: number;
  type: number;
}

interface Profile {
  avatarDetail?: NeteaseAvatarDetail | null;
  userId: number;
  avatarImgIdStr: string;
  backgroundImgIdStr: string;
  description: string;
  vipType: number;
  userType: number;
  createTime: number;
  nickname: string;
  avatarUrl: string;
  experts: NeteaseExpertMap | null;
  expertTags?: null | string[];
  djStatus: number;
  accountStatus: number;
  birthday: number;
  gender: number;
  province: number;
  city: number;
  defaultAvatar: boolean;
  avatarImgId: number;
  backgroundImgId: number;
  backgroundUrl: string;
  mutual: boolean;
  followed: boolean;
  remarkName?: null | string;
  authStatus: number;
  detailDescription: string;
  signature: string;
  authority: number;
  followeds: number;
  follows: number;
  blacklist: boolean;
  eventCount: number;
  allSubscribedCount: number;
  playlistBeSubscribedCount: number;
  avatarImgId_str: string;
  followTime?: null | number;
  followMe: boolean;
  artistIdentity: NeteaseArtistIdentity[];
  cCount: number;
  sDJPCount: number;
  playlistCount: number;
  sCount: number;
  newFollows: number;
}

export interface NeteaseAvatarDetail {
  identityIconUrl?: string;
  identityLevel?: number;
}

interface NeteaseArtistIdentity {
  id: number;
  name?: string;
}

export type NeteaseExpertMap = Record<string, boolean | null | number | string>;

interface UserPoint {
  userId: number;
  balance: number;
  updateTime: number;
  version: number;
  status: number;
  blockBalance: number;
}

export interface NeteaseUser {
  userId: number;
  nickname: string;
  avatarUrl: string;
  signature: string;
  followeds: number;
  follows: number;
  vipType: number;
}

export interface NeteaseUserSource {
  avatarUrl?: string;
  followeds?: number;
  follows?: number;
  id?: number;
  nickname?: string;
  signature?: string;
  userId?: number;
  vipType?: number;
}

/**
 * 清洗用户基础信息数据
 * @param raw 原始 API 返回的用户对象 (通常是 res.profile 或 res.creator)
 */
export const pruneUser = (raw: NeteaseUserSource | null | undefined): NeteaseUser => {
  // 1. 极简的空值防御
  if (!raw) {
    return {
      userId: 0,
      nickname: "未知用户",
      avatarUrl: "",
      signature: "",
      followeds: 0,
      follows: 0,
      vipType: 0,
    };
  }

  return {
    // 兼容处理：网易云接口中有时叫 userId，有时叫 id
    userId: raw.userId ?? raw.id ?? 0,
    nickname: raw.nickname ?? "未知用户",
    avatarUrl: raw.avatarUrl ?? "",
    // 个性签名经常为空，使用空字符串兜底防止渲染报错
    signature: raw.signature ?? "",
    followeds: raw.followeds ?? 0,
    follows: raw.follows ?? 0,
    vipType: raw.vipType ?? 0,
  };
};
