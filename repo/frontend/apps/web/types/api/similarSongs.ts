import type { RawSongDetail, SongPlaybackPrivilege } from "@/types/api/music";

/** The link-position endpoint returns server-driven resource blocks, not SongDetail[]. */
export interface SimilarSongsResponse {
  code: number;
  data?: unknown;
}

/** /simi/song returns legacy song objects; hydrate their IDs through /song/detail. */
export interface SimilarSongListResponse {
  code: number;
  songs: Array<{ id: number }>;
}

export interface SimilarSongDetailsResponse {
  code: number;
  songs: RawSongDetail[];
  privileges?: SongPlaybackPrivilege[];
}
