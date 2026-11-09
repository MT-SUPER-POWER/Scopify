import type { QqTrackDto } from "@/types/providers/qq/trackApi";

/** A song of a playlist; the CGI is asked for `new_format`, the same shape as `track_info`. */
export type QqPlaylistSongDto = QqTrackDto;

/**
 * Fields consumed from `cdlist[0]` of GET /getSongListDetail/:disstid. Anonymous reads return
 * every song at once; a read with the account session (QQ's generated playlists) can stop
 * early and then sets `hasmore`.
 */
export interface QqPlaylistDetailDto {
  disstid: string;
  dissname: string;
  logo?: string;
  desc?: string;
  nickname?: string;
  nick?: string;
  /** Encrypted on anonymous reads, the numeric QQ account on reads with a session. */
  uin?: number | string;
  encrypt_uin?: string;
  /** The creator's avatar. */
  headurl?: string;
  /** Creation time in seconds. */
  ctime?: number;
  /** 1 when the playlist is shown publicly. */
  dir_show?: number;
  tags?: { id: number; name: string }[];
  songnum?: number;
  total_song_num?: number;
  /** Play count of the anonymous CGI. */
  visitnum?: number;
  /** Play count of the session read. */
  listennum?: number;
  hasmore?: number;
  songlist?: QqPlaylistSongDto[];
}

/**
 * GET /getSongListDetail/:disstid. The upstream reply is passed through under `response`;
 * `code` is 0 on success and 10 for a playlist that cannot be read (private, or generated for
 * an account and read without its session).
 */
export interface QqPlaylistDetailResponseDto {
  response: {
    code: number;
    subcode?: number;
    cdlist?: QqPlaylistDetailDto[];
  };
}
