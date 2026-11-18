import type { RawNeteasePlaylist } from "@/types/providers/netease/playlistApi";

/** GET /user/playlist: the playlists an account created or saved, one page at a time. */
export interface NeteaseUserPlaylistsDto {
  code: number;
  more: boolean;
  playlist: RawNeteasePlaylist[];
}

/** GET /likelist: IDs of the tracks an account liked. */
export interface NeteaseLikeListDto {
  code: number;
  ids?: number[];
}

/** GET /playlist/create. */
export interface NeteaseCreatePlaylistDto {
  code: number;
  message?: string;
  playlist?: RawNeteasePlaylist;
}

/** GET /playlist/delete and /playlist/subscribe. */
export interface NeteasePlaylistWriteDto {
  code: number;
  message?: string;
}
