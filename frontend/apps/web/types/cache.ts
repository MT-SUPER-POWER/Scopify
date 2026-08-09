import type { MusicQuality } from "@/types/player";
import type { NeteaseLyric } from "@/types/api/music";

export interface PlaybackSongCacheEntry {
  /** Legacy lyric timestamp retained for backwards compatibility. */
  cachedAt: number;
  lyric: NeteaseLyric | null;
  lyricCachedAt?: number;
  url: Partial<Record<MusicQuality, string>>;
  urlCachedAt?: Partial<Record<MusicQuality, number>>;
}
