import type { RawSongDetail } from "@/types/api/music";

export interface AlbumDetailResponse {
  album?: NeteaseAlbum;
  code: number;
  songs?: RawSongDetail[];
}

export interface AlbumSublistParams {
  limit?: number;
  offset?: number;
}

export interface AlbumSubscribeResponse {
  code: number;
}

export interface NeteaseAlbum {
  artist?: NeteaseAlbumArtist;
  artists?: NeteaseAlbumArtist[];
  blurPicUrl?: string;
  company?: string;
  description?: string;
  name?: string;
  picUrl?: string;
  publishTime?: number;
  size?: number;
  subType?: string;
  type?: string;
}

export interface NeteaseAlbumArtist {
  id?: number | string;
  img1v1Url?: string;
  name?: string;
  picUrl?: string;
}
