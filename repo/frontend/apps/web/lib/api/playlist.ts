import type {
  PlaylistHighQualityTagsResponse,
  UpdatePlaylistParams,
} from "@/types/api/playlistTags";
import type {
  DailyRecommendationDislikeResponse,
  HistoricalDailyRecommendationDetailResponse,
  HistoricalDailyRecommendationsResponse,
  LikeListResponse,
  PlaylistAllTracksParams,
  PlaylistDetailParams,
  PlaylistDetailResponse,
  PersonalizedPlaylistsResponse,
  PlaylistTracksResponse,
  RecommendedPlaylistsResponse,
  UserPlaylistResponse,
} from "@/types/api/playlist";
import request, { requestConfig } from "../web/request";

/**
 * 登录后调用此接口 , 传入用户 id, 可以获取用户歌单
 * @param uid 用户 id
 * @param limit 返回数量 , 默认为 30
 * @param offset 偏移数量，用于分页 , 如 :( 页数 -1)*30, 其中 30 为 limit 的值 , 默认为 0
 * @returns
 */
export function getUserPlaylist(uid: number, limit = 30, offset = 0) {
  return request.get<UserPlaylistResponse>("/user/playlist", { params: { uid, limit, offset } });
}

/**
 * 传入用户 id, 可以获取用户创建的歌单
 * @param uid 用户 id
 * @param limit 返回数量 , 默认为 30
 * @param offset 偏移数量，用于分页 , 如 :( 页数 -1)*30, 其中 30 为 limit 的值 , 默认为 0
 * @returns
 */
export function getUserPlaylistByID(uid: number, limit = 30, offset = 0) {
  return request.get("/user/playlist/create", { params: { uid, limit, offset } });
}

/**
 * 获取歌单所有歌曲
 * @param id 歌单 id
 * @param limit 限制获取歌曲的数量，默认值为当前歌单的歌曲数量
 * @param offset 偏移量，默认 0
 * @returns 歌曲列表数据
 */
export function getPlaylistAllTracks({
  id,
  limit,
  offset,
  requiresMusicSession,
}: PlaylistAllTracksParams) {
  return request.get<PlaylistTracksResponse>(
    "/playlist/track/all",
    requestConfig({ params: { id, limit, offset }, requiresMusicSession }),
  );
}

/**
 * 获取最近播放-歌曲
 * @param limit 返回数量，默认为 10
 * @returns 最近播放的歌曲列表数据
 */
export function getRecentSongs(limit = 10) {
  return request.get("/record/recent/song", { params: { limit } });
}

/**
 * 获取用户喜欢的歌曲列表
 */
export function getUserLikeLists(uid: number | string) {
  return request.get<LikeListResponse>("/likelist", { params: { uid } });
}

/**
 * 喜欢和取消喜欢
 */
export function likeSong(id: number | string, like: boolean) {
  return request.get("/like", { params: { id, like } });
}

/**
 *
 * @param name
 * @param privacy 默认为为公开 10 为私密 0 为普通歌单
 * @returns
 */
export function createPlaylist(name: string, privacy = "0") {
  return request.get("/playlist/create", { params: { name, privacy } });
}

/**
 *
 * @param id 被删除的歌单 id
 * @returns
 */
export function delPlaylist(id: number | string) {
  return request.get("/playlist/delete", { params: { id } });
}

// 收藏/取消收藏歌单 (t: 1收藏, 2取消)
export function subscribePlaylist(t: 1 | 2, id: number | string) {
  return request.get(`/playlist/subscribe`, {
    params: { t, id },
  });
}

/**
 * 更新歌单封面
 * @param id 歌单 id
 * @param imgFile 图片文件对象
 * @param imgSize 图片尺寸, 默认为 300
 */
export function updatePlaylist(
  idOrParams: number | string | UpdatePlaylistParams,
  name?: string,
  desc?: string,
  tags?: string[],
) {
  const params =
    typeof idOrParams === "object"
      ? idOrParams
      : {
          id: idOrParams,
          name: name ?? "",
          desc,
          tags,
        };

  return request.get("/playlist/update", {
    params: { ...params, tags: params.tags?.join(";") },
  });
}

export function getPlaylistHighQualityTags() {
  return request.get<PlaylistHighQualityTagsResponse>("/playlist/highquality/tags");
}

export function updatePlaylistTags(id: number | string, tags: string[]) {
  return request.get("/playlist/tags/update", {
    params: { id, tags: tags.join(";") },
  });
}

/**
 * 更新歌单封面
 * @param id 歌单 id
 * @param imgFile 图片文件对象
 * @param imgSize 图片尺寸, 默认为 300
 */
export function updatePlaylistCover(id: number | string, imgFile: File, imgSize = 300) {
  const formData = new FormData();
  formData.append("imgFile", imgFile);
  return request.post(`/playlist/cover/update?id=${id}&imgSize=${imgSize}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
}

export function getPersonalizePlaylists(limit = 100) {
  return request.get<PersonalizedPlaylistsResponse>("/personalized", { params: { limit } });
}

export function getPlaylsitDetail({ id, requiresMusicSession }: PlaylistDetailParams) {
  return request.get<PlaylistDetailResponse>(
    "/playlist/detail",
    requestConfig({ params: { id }, requiresMusicSession }),
  );
}

// 获取每日推荐歌单
export function getRecommendedPlaylists() {
  return request.get<RecommendedPlaylistsResponse>(
    "/recommend/resource",
    requestConfig({ requiresMusicSession: true }),
  );
}

// 不喜欢某一首每日推荐
export function dislikeDailyRecommend(id: number | string) {
  return request.get<DailyRecommendationDislikeResponse>(
    "/recommend/songs/dislike",
    requestConfig({ params: { id }, requiresMusicSession: true }),
  );
}

/** 获取当前账号可查看的历史日推日期。 */
export function getHistoricalDailyRecommendations() {
  return request.get<HistoricalDailyRecommendationsResponse>(
    "/history/recommend/songs",
    requestConfig({ requiresMusicSession: true }),
  );
}

/** 获取指定日期的历史日推歌曲。 */
export function getHistoricalDailyRecommendationDetail(date: string) {
  return request.get<HistoricalDailyRecommendationDetailResponse>(
    "/history/recommend/songs/detail",
    requestConfig({ params: { date }, requiresMusicSession: true }),
  );
}
