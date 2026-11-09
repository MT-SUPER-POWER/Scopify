import type { QqTrackDto } from "@/types/providers/qq/trackApi";

/**
 * One entry of GET /user/playlist. Playlists the account created (`GetPlaylistByUin`) and
 * playlists it saved (`CgiGetPlaylistFavInfo`) name some fields differently, so each reads
 * the first one present.
 */
export interface QqLibraryPlaylistEntryDto {
  /** The playlist's global ID, which every playlist read and write takes. */
  tid: number;
  /** The directory number inside the account; 201 is the built-in "liked songs". */
  dirId?: number;
  /** 0 for an ordinary playlist; generated ones (daily, mixes) carry another type. */
  dirType?: number;
  dirName?: string;
  name?: string;
  dissname?: string;
  songNum?: number;
  songnum?: number;
  /** 1 when the playlist is shown publicly. */
  dirShow?: number;
  picUrl?: string;
  bigpicUrl?: string;
  logo?: string;
  albumPicUrl?: string;
  /** Seconds since the epoch. */
  createTime?: number;
  /** The creator's account number; "0" on public reads. */
  uin?: number | string;
  nick?: string;
  nickname?: string;
  headurl?: string;
}

/**
 * GET /user/playlist. The created playlists come first, then the saved ones. `more` is true
 * while the list cannot be confirmed whole; `nextFavoriteOffset` continues a long list.
 */
export interface QqUserPlaylistsDto {
  code: number;
  playlist: QqLibraryPlaylistEntryDto[];
  total: number;
  more: boolean;
  nextFavoriteOffset?: number;
}

/** GET /user/liked-songs: a page of the built-in "liked songs", in the shape of playlist songs. */
export interface QqLikedSongsDto {
  code: number;
  songs: QqTrackDto[];
  total: number;
  more: boolean;
}

/**
 * One entry of GET /user/albums. The upstream list is passed through as it is, with the album
 * identity under either name the upstream uses.
 */
export interface QqLibraryAlbumEntryDto {
  albummid?: string;
  album_mid?: string;
  albumMid?: string;
  albumname?: string;
  album_name?: string;
  albumName?: string;
  singername?: string;
  singer_name?: string;
  picurl?: string;
  pic?: string;
  songnum?: number;
  song_num?: number;
  /** Seconds since the epoch. */
  ordertime?: number;
  order_time?: number;
}

/** GET /user/albums. */
export interface QqUserAlbumsDto {
  code: number;
  albums: QqLibraryAlbumEntryDto[];
  total: number;
  more: boolean;
}

/** POST /user/song/like. */
export interface QqSongLikeDto {
  code: number;
  liked: boolean;
}

/** POST /user/playlist/create. */
export interface QqPlaylistCreateDto {
  code: number;
  tid: number;
  dirId: number;
  name: string;
}

/** POST /user/playlist/rename, /user/playlist/delete and /user/playlist/subscribe. */
export interface QqPlaylistWriteDto {
  code: number;
}

/** POST /user/playlist/tracks. `changed` is false when the tracks were already as asked. */
export interface QqPlaylistTracksWriteDto {
  code: number;
  changed: boolean;
}
