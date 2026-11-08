import type { RawSongDetail, SongPlaybackPrivilege } from "@/types/song/api";

/** A playlist as NetEase's playlist, user and recommendation endpoints return it. */
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
  lastSong?: {
    al?: { id?: number; name?: string; picUrl?: string };
    ar?: Array<{ id?: number; name?: string }>;
    id?: number;
    name?: string;
  };
}

/**
 * NetEase playlist fields with no neutral counterpart. They travel with a NetEase playlist
 * detail and only NetEase features read them (liked-songs special type, collecting).
 */
export interface NeteasePlaylistExtras {
  /** 5 marks the account's liked-songs playlist. */
  specialType?: number;
  subscribed: boolean;
  subscribedCount: number;
}

/** GET /playlist/detail parameters. */
export interface NeteasePlaylistDetailParams {
  id: number | string;
  requiresMusicSession?: boolean;
}

/** GET /playlist/detail. */
export interface NeteasePlaylistDetailDto {
  code: number;
  playlist?: RawNeteasePlaylist;
}

/** GET /playlist/track/all parameters. */
export interface NeteasePlaylistTracksParams {
  id: number | string;
  limit?: number;
  offset?: number;
  requiresMusicSession?: boolean;
}

/** GET /playlist/track/all; privileges come apart from the songs. */
export interface NeteasePlaylistTracksDto {
  code: number;
  privileges?: SongPlaybackPrivilege[];
  songs?: RawSongDetail[];
}
