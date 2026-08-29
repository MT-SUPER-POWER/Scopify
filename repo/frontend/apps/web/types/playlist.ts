import type { RefObject } from "react";

export interface PlaylistInfo {
  description?: string;
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

export interface PlaylistStickyControlsOptions {
  actionBarRef: RefObject<HTMLDivElement | null>;
  enabled: boolean;
  sentinelRef: RefObject<HTMLDivElement | null>;
  topOffset: number;
}

/** Separates the selected historical day from the date used to key the daily cache. */
export interface DailyRecommendationRequest {
  cacheDate: string;
  dailyDate: null | string;
}
