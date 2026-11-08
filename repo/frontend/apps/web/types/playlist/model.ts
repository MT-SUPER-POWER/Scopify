import type { MusicResourceRef } from "@scopify/music-domain/identity";
import type { MusicPlaylistDetail } from "@scopify/music-domain/playlist";

import type { PlayerTrack } from "@/types/player/model";
import type { NeteasePlaylistExtras } from "@/types/providers/netease/playlistApi";

/** A playlist detail as pages read it: interface fields, plus NetEase's own when from NetEase. */
export type PlaylistDetail = MusicPlaylistDetail & { readonly netease?: NeteasePlaylistExtras };

/** What a playlist route renders. Daily recommendations are a list without a playlist detail. */
export interface PlaylistContent {
  detail: PlaylistDetail | null;
  tracks: PlayerTrack[];
}

export interface PlaylistContentRequest {
  /** Stable cache identity for today's recommendations, separate from a selected history date. */
  dailyCacheDate: string;
  dailyDate: null | string;
  isDailyRecommendation: boolean;
  isRecommend: boolean;
  playlistId: null | string;
}

export interface PlaylistInfo {
  /** The playlist shown, when the page shows a real one rather than a generated list. */
  ref?: MusicResourceRef<"playlist">;
  description?: string;
  specialType?: number;
  isSpecial: boolean;
  dailyDate?: string;
  privacy: string;
  tags: string[];
  title: string;
  cover: string | null;
  createTime: string;
  creator: string;
  creatorID?: number | string | null;
  creatorAvatar: string;
  likes: number | string;
  totalSongs: number;
  creatorHref?: string;
  createTimeLabel?: string;
  likesLabel?: string;
  totalSongsLabel?: string;
  subscribed?: boolean | null;
}

/** Separates the selected historical day from the date used to key the daily cache. */
export interface DailyRecommendationRequest {
  cacheDate: string;
  dailyDate: null | string;
}

export interface SongLikeMutationContext {
  previousLikeListIDs: number[];
}

export interface SongLikeMutationMessages {
  failure: string;
  liked: string;
  unliked: string;
}

export interface SongLikeMutationDependencies {
  clearPageCache(): Promise<unknown>;
  mutateSong(songId: number | string, like: boolean): Promise<unknown>;
}

export interface PlaylistUpdateInput {
  name: string;
  desc?: string;
  tags?: string[];
  coverFile?: File | null;
}
