import type { RawSongDetail } from "@/types/api/music";
import type { NeteaseUserAlbum } from "@/types/api/release";

export interface AlbumDetailResponse {
  album?: NeteaseAlbum;
  code: number;
  songs?: RawSongDetail[];
}

export interface AlbumSublistParams {
  cookie?: string;
  limit?: number;
  offset?: number;
}

/** `/album/sublist` 在认证态返回 `data`，匿名态只返回 `code` 和 `paidCount`。 */
export interface AlbumSublistResponse {
  code: number;
  count?: number;
  data?: NeteaseUserAlbum[];
  hasMore?: boolean;
  paidCount?: number;
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
