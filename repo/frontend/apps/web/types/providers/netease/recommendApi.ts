import type { RawRecommendPlaylist } from "@/types/playlist/api";
import type { RawSongDetail } from "@/types/song/api";

/** `/personalized`: playlists anyone gets. */
export interface NeteasePersonalizedPlaylistsDto {
  category: number;
  code: number;
  hasTaste: boolean;
  result?: RawRecommendPlaylist[];
}

/** `/recommend/resource`. `recommend` is missing when signed out or the session is stale. */
export interface NeteaseRecommendedPlaylistsDto {
  code: number;
  featureFirst?: boolean;
  recommend?: RawRecommendPlaylist[];
}

/** `/personalized/newsong`. */
export interface NeteaseNewSongItemDto {
  id: number;
  name: string;
  picUrl: string;
  song: RawSongDetail;
}

export interface NeteaseNewSongsDto {
  code: number;
  result?: NeteaseNewSongItemDto[];
}

/** An album of `/album/newest`. */
export interface NeteaseNewestAlbumDto {
  id?: number;
  artist?: { id?: number | string; name?: string };
  artists?: { id?: number | string; name?: string }[];
  name?: string;
  picUrl?: string;
  publishTime?: number;
}

export interface NeteaseNewestAlbumsDto {
  albums?: NeteaseNewestAlbumDto[];
  code: number;
  total?: number;
}

export interface NeteaseToplistTrackPreviewDto {
  first: string;
  second: string;
}

export interface NeteaseToplistDto {
  id: number;
  name: string;
  coverImgUrl: string;
  updateFrequency?: string;
  playCount?: number;
  tracks?: NeteaseToplistTrackPreviewDto[];
  description?: string;
}

/** `/toplist/detail`. */
export interface NeteaseToplistsDto {
  code: number;
  list?: NeteaseToplistDto[];
  artistToplist?: unknown;
}

/** `/personal_fm` and `/personal/fm/mode`. */
export interface NeteasePersonalFmDto {
  code: number;
  data?: RawSongDetail[];
  message?: string;
  msg?: string;
}

export interface NeteasePersonalFmModeParams {
  mode: string;
  submode?: string;
}

export interface NeteasePersonalFmTrashDto {
  code: number;
  message?: string;
}
