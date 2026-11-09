import type { MusicPlaybackQuality, MusicPlaybackSource } from "@scopify/music-domain/playback";

import { getQqMusicPlay } from "@/lib/providers/qq/api/playback";
import type { QqPlaybackQuality } from "@/types/providers/qq/playbackApi";

/**
 * Tiers to ask for, best first. QQ has no tier above flac that the backend serves by name, so
 * everything above `high` asks for `best`, which falls back by itself. `320` does not fall back,
 * so `high` asks for `128` when it is missing.
 */
function qqQualityLadder(quality: MusicPlaybackQuality): QqPlaybackQuality[] {
  if (quality === "standard") return ["128"];
  if (quality === "high") return ["320", "128"];
  return ["best"];
}

/** QQ URLs are signed per request and not cached here, so there is nothing to invalidate. */
export const qqPlaybackSource: MusicPlaybackSource = {
  async resolvePlayableSource(track, request) {
    if (track.provider !== "qq" || !track.id) {
      return { reason: "invalid-qq-song-mid", retryable: false, status: "unavailable" };
    }
    let reason = "qq-playable-source-unavailable";
    try {
      for (const quality of qqQualityLadder(request.quality)) {
        const data = await getQqMusicPlay(track.id, quality, request.signal);
        const entry = data.data.playUrl[track.id];
        if (entry?.url) {
          return { source: { replayGain: null, url: entry.url }, status: "resolved" };
        }
        if (entry?.restriction?.key) reason = `qq-${entry.restriction.key}`;
      }
    } catch {
      // Keep the response and signed URL out of the reason; it can reach diagnostics.
      return { reason: "qq-source-request-failed", retryable: true, status: "unavailable" };
    }
    return { reason, retryable: false, status: "unavailable" };
  },

  async invalidatePlayableSource() {},
};
