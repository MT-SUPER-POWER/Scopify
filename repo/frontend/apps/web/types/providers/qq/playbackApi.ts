/** File tiers `GET /getMusicPlay` accepts; `best` walks flac → 320 → 128 and reports the tier served. */
export type QqPlaybackQuality = "128" | "320" | "flac" | "best";

/** Why a song has no URL. Only `key` is read; the hint text is for diagnostics. */
export interface QqPlaybackRestrictionDto {
  key: string;
  hint?: { key: string; message?: string };
}

/** One song in `playUrl`. `url` is empty when the song cannot be played at this tier. */
export interface QqPlayUrlEntryDto {
  url: string;
  error: string | false;
  quality?: string;
  preview?: true;
  restriction?: QqPlaybackRestrictionDto;
}

/** GET /getMusicPlay?songmid=…&quality=… with `resType=play` (the default): one entry per MID. */
export interface QqMusicPlayDto {
  data: { playUrl: Record<string, QqPlayUrlEntryDto> };
}
