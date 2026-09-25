import type {
  UpdateUserProfilePayload,
  UpdateUserProfileResponse,
} from "@/types/api/profileUpdate";
import type { UserPlaylistResponse } from "@/types/api/playlist";
import type {
  IUserDetail,
  RecentPlaylistsResponse,
  RecentSongsResponse,
  UserAccountResponse,
  UserFollowsResponse,
  UserRecordResponse,
} from "@/types/api/user";
import request, { requestConfig } from "../web/request";

// /user/detail
export function getUserDetail(uid: number | string) {
  return request.get<IUserDetail>("/user/detail", { params: { uid } });
}

// /user/playlist
export function getUserPlaylist(uid: number, limit = 30, offset = 0) {
  return request.get<UserPlaylistResponse>("/user/playlist", { params: { uid, limit, offset } });
}

// 播放历史
export function getUserRecord(uid: number, type = 0) {
  return request.get("/user/record", requestConfig({ params: { uid, type } }));
}

// 获取用户历史评论
export function getUserComments(uid: number) {
  return request.get("/user/comment/history", requestConfig({ params: { uid } }));
}

// 最近播放-歌曲
export function getRecentSongs(limit = 10) {
  return request.get<RecentSongsResponse>(
    "/record/recent/song",
    requestConfig({ params: { limit } }),
  );
}

// 最近播放-歌曲
/**
 *
 * @param uid user id
 * @param type 0: 所有时间，1：最近一周
 * @param limit number of songs to return, default 10
 * @returns
 */
export function getRecentSongsByID(uid: number, type = 1, limit = 10) {
  return request.get<UserRecordResponse>(
    "/user/record",
    requestConfig({ params: { uid, type, limit } }),
  );
}

// 最近播放-歌单
export function getRecentPlaylists(limit = 10) {
  return request.get<RecentPlaylistsResponse>(
    "/record/recent/playlist",
    requestConfig({ params: { limit }, requiresMusicSession: true }),
  );
}

// 最近播放-专辑
export function getRecentAlbums(limit = 100) {
  return request.get(
    "/record/recent/album",
    requestConfig({ params: { limit }, requiresMusicSession: true }),
  );
}

// 获取用户关注列表
export function getUserFollows(uid: number, limit = 30, offset = 0) {
  return request.get("/user/follows", { params: { uid, limit, offset } });
}

// 获取用户粉丝列表
export function getUserFollowers(uid: number, limit = 30, offset = 0) {
  return request.post("/user/followeds", { uid, limit, offset });
}

// 获取用户账号信息
export const getUserAccount = () => {
  return request.get<UserAccountResponse>(
    "/user/account",
    requestConfig({ requiresMusicSession: true }),
  );
};

// 获取用户详情
export const getUserDetailInfo = (params: { uid: string | number }) => {
  return request<IUserDetail>({
    url: "/user/detail",
    method: "get",
    params,
  });
};

// 获取用户关注列表
export const getUserFollowsInfo = (params: {
  uid: string | number;
  limit?: number;
  offset?: number;
}) => {
  return request<UserFollowsResponse>({
    url: "/user/follows",
    method: "get",
    params,
  });
};

// 获取用户歌单
export const getUserPlaylists = (params: { uid: string | number }) => {
  return request<UserPlaylistResponse>({
    url: "/user/playlist",
    method: "get",
    params,
  });
};

export const updateUserProfile = (payload: UpdateUserProfilePayload) => {
  return request.get<UpdateUserProfileResponse>("/user/update", {
    params: payload,
  });
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 网易乐签
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import type {
  VipSignDetailResponse,
  VipSignHistoryResponse,
  VipSignInfoResponse,
  VipSignResponse,
} from "@/types/api/vipSign";

/** 网易乐签 - VIP签到 POST /vip/sign */
export function vipSign() {
  return request.post<VipSignResponse>(
    "/vip/sign",
    {},
    requestConfig({ requiresMusicSession: true }),
  );
}

/** 网易乐签 - 签到信息 GET /vip/sign/info */
export function vipSignInfo() {
  return request.get<VipSignInfoResponse>(
    "/vip/sign/info",
    requestConfig({ requiresMusicSession: true }),
  );
}

/** 网易乐签 - 指定日期详情 GET /vip/sign/detail */
export function vipSignDetail(timestamp: number) {
  return request.get<VipSignDetailResponse>(
    "/vip/sign/detail",
    requestConfig({ params: { timestamp }, requiresMusicSession: true }),
  );
}

/** 网易乐签 - 七日打卡状态 GET /vip/sign/history?type=1 */
export function vipSignHistory() {
  return request.get<VipSignHistoryResponse>(
    "/vip/sign/history",
    requestConfig({ params: { type: 1 }, requiresMusicSession: true }),
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 用户徽章与社交状态
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import type { UserMedalResponse } from "@/types/api/userMedal";
import type {
  UserSocialStatusEditParams,
  UserSocialStatusEditResponse,
  UserSocialStatusRcmdResponse,
  UserSocialStatusResponse,
  UserSocialStatusSupportResponse,
} from "@/types/api/userSocialStatus";

/**
 * 用户徽章
 * 传入用户 id, 获取用户徽章
 * @param uid - 用户 ID
 * @param signal - AbortSignal
 */
export function getUserMedals(uid: number | string, signal?: AbortSignal) {
  return request.get<UserMedalResponse>("/user/medal", {
    params: { uid },
    signal,
  });
}

/**
 * 用户状态
 * 登录后调用此接口, 传入用户 id, 获取用户状态
 * @param uid - 用户 ID
 * @param signal - AbortSignal
 */
export function getUserSocialStatus(uid: number | string, signal?: AbortSignal) {
  return request.get<UserSocialStatusResponse>(
    "/user/social/status",
    requestConfig({
      params: { uid },
      requiresMusicSession: true,
      signal,
    }),
  );
}

/**
 * 用户状态 - 支持设置的状态
 * 登录后调用此接口, 获取支持设置的状态
 * @param signal - AbortSignal
 */
export function getSupportSocialStatuses(signal?: AbortSignal) {
  return request.get<UserSocialStatusSupportResponse>(
    "/user/social/status/support",
    requestConfig({
      requiresMusicSession: true,
      signal,
    }),
  );
}

/**
 * 用户状态 - 相同状态的用户
 * 登录后调用此接口, 获取相同状态的用户
 * @param signal - AbortSignal
 */
export function getRcmdSocialStatusUsers(signal?: AbortSignal) {
  return request.get<UserSocialStatusRcmdResponse>(
    "/user/social/status/rcmd",
    requestConfig({
      requiresMusicSession: true,
      signal,
    }),
  );
}

/**
 * 用户状态 - 编辑
 * 登录后调用此接口, 编辑当前用户状态，所需参数可在接口/user/social/status/support获取
 * @param params - 状态参数
 */
export function editUserSocialStatus(params: UserSocialStatusEditParams) {
  return request.post<UserSocialStatusEditResponse>(
    "/user/social/status/edit",
    {},
    requestConfig({
      params,
      requiresMusicSession: true,
    }),
  );
}
