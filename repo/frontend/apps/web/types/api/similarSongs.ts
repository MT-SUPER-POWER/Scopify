import type { RawSongDetail, SongPlaybackPrivilege } from "@/types/api/music";

/** The link-position endpoint returns server-driven resource blocks, not SongDetail[]. */
export interface SimilarSongsResponse {
  code: number;
  data?: unknown;
}

export interface SimilarSongDetailsResponse {
  code: number;
  songs: RawSongDetail[];
  privileges?: SongPlaybackPrivilege[];
}
