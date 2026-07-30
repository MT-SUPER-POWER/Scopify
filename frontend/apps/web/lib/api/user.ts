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
    requestConfig({ params: { limit } }),
  );
}

// 最近播放-专辑
export function getRecentAlbums(limit = 100) {
  return request.get("/record/recent/album", requestConfig({ params: { limit } }));
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
export const getUserAccount = (cookie?: string) => {
  return request.get<UserAccountResponse>("/user/account", {
    params: { cookie: cookie },
  });
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
export function vipSign(cookie?: string) {
  return request.post<VipSignResponse>("/vip/sign", {}, requestConfig({ params: { cookie } }));
}

/** 网易乐签 - 签到信息 GET /vip/sign/info */
export function vipSignInfo(cookie?: string) {
  return request.get<VipSignInfoResponse>("/vip/sign/info", requestConfig({ params: { cookie } }));
}

/** 网易乐签 - 指定日期详情 GET /vip/sign/detail */
export function vipSignDetail(timestamp: number, cookie?: string) {
  return request.get<VipSignDetailResponse>(
    "/vip/sign/detail",
    requestConfig({ params: { cookie, timestamp } }),
  );
}

/** 网易乐签 - 七日打卡状态 GET /vip/sign/history?type=1 */
export function vipSignHistory(cookie?: string) {
  return request.get<VipSignHistoryResponse>(
    "/vip/sign/history",
    requestConfig({ params: { cookie, type: 1 } }),
  );
}
