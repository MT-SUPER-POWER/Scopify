import { qqClient } from "@/lib/providers/qq/client";
import type { QqMusicPlayDto, QqPlaybackQuality } from "@/types/providers/qq/playbackApi";

/**
 * Playback URL for one MID. Without a QQ session the backend uses the anonymous key, which
 * serves 128 kbps for songs that need no VIP; with one it serves the account's tiers.
 */
export function getQqMusicPlay(mid: string, quality: QqPlaybackQuality, signal?: AbortSignal) {
  return qqClient.requestData<QqMusicPlayDto>({
    url: "/getMusicPlay",
    params: { songmid: mid, quality },
    signal,
    errorContext: { operation: "qq.song.play", quality },
  });
}
