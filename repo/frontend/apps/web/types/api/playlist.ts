import {
  pruneSongDetail,
  type RawSongDetail,
  type SongDetail,
  type SongPlaybackPrivilege,
} from "@/types/api/music";

export interface NeteasePlaylist {
  id: number;
  name: string;
  createTime: number;
  coverImgUrl: string;
  description: string;
  trackCount: number;
  playCount: number;
  privacy: 0 | 10; // 0: 公开, 10: 私密
  subscribed: boolean;
  subscribedCount: number;
  tags: string[];
  creator: {
    nickname: string;
    avatarUrl: string;
  };
}

export interface RawNeteasePlaylist {
  coverImgUrl?: string;
  creator?: {
    avatarUrl?: string;
    nickname?: string;
    userId?: number;
  };
  createTime?: number;
  description?: null | string;
  id?: number;
  name?: string;
  picUrl?: string;
  playCount?: number;
  privacy?: number;
  subscribed?: boolean | null;
  subscribedCount?: number;
  specialType?: number;
  songCount?: number;
  tags?: string[];
  trackCount?: number;
  trackIds?: unknown[];
  trackNumber?: number;
  tracks?: RawSongDetail[];
}

export interface UserPlaylistResponse {
  code: number;
  more: boolean;
  playlist: RawNeteasePlaylist[];
}

export const prunePlaylist = (raw: null | RawNeteasePlaylist | undefined): NeteasePlaylist => {
  if (!raw) {
    return {
      coverImgUrl: "",
      createTime: 0,
      creator: { avatarUrl: "", nickname: "" },
      description: "",
      id: 0,
      name: "",
      playCount: 0,
      privacy: 0,
      subscribed: false,
      subscribedCount: 0,
      tags: [],
      trackCount: 0,
    };
  }

  return {
    id: raw.id ?? 0,
    name: raw.name ?? "",
    createTime: raw.createTime ?? 0,
    coverImgUrl: raw.coverImgUrl ?? raw.picUrl ?? "",
    description: raw.description ?? "",
    trackCount: getPlaylistTrackCount(raw),
    playCount: raw.playCount ?? 0,
    privacy: raw.privacy === 10 ? 10 : 0,
    subscribed: Boolean(raw.subscribed),
    subscribedCount: raw.subscribedCount ?? 0,
    tags: raw.tags ?? [],
    creator: {
      nickname: raw.creator?.nickname ?? "未知用户",
      avatarUrl: raw.creator?.avatarUrl ?? "",
    },
  };
};

/**
 * 最近播放记录中的歌单并不总是使用 `trackCount`，因此需要兼容客户端返回的替代字段。
 */
export function getPlaylistTrackCount(playlist: null | RawNeteasePlaylist | undefined): number {
  if (!playlist) return 0;

  const declaredCount = [playlist.trackCount, playlist.songCount, playlist.trackNumber].find(
    (value): value is number => typeof value === "number" && Number.isFinite(value) && value > 0,
  );
  if (declaredCount !== undefined) return declaredCount;

  return playlist.trackIds?.length ?? playlist.tracks?.length ?? 0;
}

export interface RecommendPlaylist {
  id: number;
  name: string;
  picUrl: string;
  playCount: number;
  trackCount: number;
  copywriter: string; //  推荐理由文案
}

export interface RawRecommendPlaylist {
  copywriter?: string;
  id?: number;
  name?: string;
  picUrl?: string;
  playCount?: number;
  trackCount?: number;
}

/** `/personalized` 的实际响应。 */
export interface PersonalizedPlaylistsResponse {
  category: number;
  code: number;
  hasTaste: boolean;
  result?: RawRecommendPlaylist[];
}

/** `/recommend/resource` 的实际响应。未登录或会话失效时 `recommend` 可能缺失。 */
export interface RecommendedPlaylistsResponse {
  code: number;
  featureFirst?: boolean;
  recommend?: RawRecommendPlaylist[];
}

export interface PlaylistTracksResponse {
  code: number;
  privileges?: SongPlaybackPrivilege[];
  songs?: RawSongDetail[];
}

export interface PlaylistAllTracksParams {
  cookie?: string;
  id: number | string;
  limit?: number;
  offset?: number;
  requiresMusicSession?: boolean;
}

export interface PlaylistDetailParams {
  cookie?: string;
  id: number | string;
  requiresMusicSession?: boolean;
}

export interface PlaylistDetailResponse {
  code: number;
  playlist?: RawNeteasePlaylist;
}

/** The detail and tracks rendered by a playlist route. */
export interface PlaylistContent {
  rawDetail: RawNeteasePlaylist;
  tracks: SongDetail[];
}

export interface PlaylistContentRequest {
  /** Stable cache identity for today's recommendations, separate from a selected history date. */
  dailyCacheDate: string;
  dailyDate: null | string;
  isDailyRecommendation: boolean;
  isRecommend: boolean;
  playlistId: null | string;
}

export function prunePlaylistTracks(response: PlaylistTracksResponse): SongDetail[] {
  const privilegesBySongId = new Map(
    (response.privileges ?? []).map((privilege) => [privilege.id, privilege]),
  );

  return (response.songs ?? []).map((song) =>
    pruneSongDetail({
      ...song,
      privilege: privilegesBySongId.get(song.id) ?? song.privilege,
    }),
  );
}

export type PlaylistTrackOperation = "add" | "del";

/** Successful payload from `GET /playlist/tracks`. */
export interface PlaylistTrackUpdateResponse {
  code: 200;
}

export interface PlaylistTrackMutationVariables {
  operation: PlaylistTrackOperation;
  playlistId: number | string;
  trackId: number | string;
}

export interface LikeListResponse {
  code: number;
  ids?: number[];
}

export interface DailyRecommendationDislikeResponse {
  code: number;
  data?: RawSongDetail;
}

/** `/history/recommend/songs` 提供的历史日推日期与会员提示信息。 */
export interface HistoricalDailyRecommendationData {
  dates?: string[];
  description?: null | string;
  noHistoryMessage?: null | string;
  purchaseUrl?: null | string;
  songs?: null | RawSongDetail[];
}

/** `/history/recommend/songs` 的响应。 */
export interface HistoricalDailyRecommendationsResponse {
  code: number;
  data?: HistoricalDailyRecommendationData;
}

/** `/history/recommend/songs/detail` 中指定日期的歌曲数据。 */
export interface HistoricalDailyRecommendationDetailData extends HistoricalDailyRecommendationData {
  dailySongs?: RawSongDetail[];
  recommendReasons?: Array<{
    reason?: string;
    songId?: number;
  }>;
}

/** `/history/recommend/songs/detail` 的响应。 */
export interface HistoricalDailyRecommendationDetailResponse {
  code: number;
  data?: HistoricalDailyRecommendationDetailData;
}

export const pruneRecommendPlaylist = (
  raw: null | RawRecommendPlaylist | undefined,
): RecommendPlaylist => {
  if (!raw) {
    return { copywriter: "", id: 0, name: "", picUrl: "", playCount: 0, trackCount: 0 };
  }

  return {
    id: raw.id ?? 0,
    name: raw.name ?? "",
    picUrl: raw.picUrl ?? "",
    playCount: raw.playCount ?? 0,
    trackCount: raw.trackCount ?? 0,
    copywriter: raw.copywriter ?? "",
  };
};
