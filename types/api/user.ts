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

interface ProfileVillageInfo {
  title: string;
  imageUrl?: any;
  targetUrl: string;
}

interface Binding {
  userId: number;
  url: string;
  expiresIn: number;
  refreshTime: number;
  bindingTime: number;
  tokenJsonStr?: any;
  expired: boolean;
  id: number;
  type: number;
}

interface Profile {
  avatarDetail?: any;
  userId: number;
  avatarImgIdStr: string;
  backgroundImgIdStr: string;
  description: string;
  vipType: number;
  userType: number;
  createTime: number;
  nickname: string;
  avatarUrl: string;
  experts: any;
  expertTags?: any;
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
  remarkName?: any;
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
  followTime?: any;
  followMe: boolean;
  artistIdentity: any[];
  cCount: number;
  sDJPCount: number;
  playlistCount: number;
  sCount: number;
  newFollows: number;
}

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
}

/**
 * 清洗用户基础信息数据
 * @param raw 原始 API 返回的用户对象 (通常是 res.profile 或 res.creator)
 */
export const pruneUser = (raw: any): NeteaseUser => {
  // 1. 极简的空值防御
  if (!raw) {
    return {
      userId: 0,
      nickname: "未知用户",
      avatarUrl: "",
      signature: "",
      followeds: 0,
      follows: 0,
    };
  }

  return {
    // 兼容处理：网易云接口中有时叫 userId，有时叫 id
    userId: raw.userId || raw.id || 0,
    nickname: raw.nickname || "未知用户",
    avatarUrl: raw.avatarUrl || "",
    // 个性签名经常为空，使用空字符串兜底防止渲染报错
    signature: raw.signature || "",
    followeds: raw.followeds || 0,
    follows: raw.follows || 0,
  };
};
