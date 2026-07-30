import type { MusicQuality } from "@/types/player";
import type { NeteaseLyric } from "@/types/api/music";

export interface PlaybackSongCacheEntry {
  cachedAt: number;
  lyric: NeteaseLyric | null;
  url: Partial<Record<MusicQuality, string>>;
}
