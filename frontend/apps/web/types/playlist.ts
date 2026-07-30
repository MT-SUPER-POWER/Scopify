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
}

export interface PlaylistStickyControlsOptions {
  actionBarRef: RefObject<HTMLDivElement | null>;
  enabled: boolean;
  sentinelRef: RefObject<HTMLDivElement | null>;
  topOffset: number;
}
