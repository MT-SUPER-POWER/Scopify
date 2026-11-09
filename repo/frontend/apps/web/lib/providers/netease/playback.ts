import type { MusicResourceRef } from "@scopify/music-domain/identity";
import type { MusicPlaybackQuality, MusicPlaybackSource } from "@scopify/music-domain/playback";

import { getCachedReplayGain } from "@/lib/cache/playbackCache";
import { webNeteasePlayableSourceResolver } from "@/lib/player/adapters/neteasePlayableSourceAdapter";
import type { MusicQuality } from "@/types/player/model";
import type { ImmerseType } from "@/types/song/api";

const IMMERSE_TYPES: ReadonlySet<string> = new Set<ImmerseType>([
  "c51",
  "ste",
  "aac",
  "c512",
  "ste2",
  "aac2",
]);

/** NetEase names the master tier `jymaster`; every other tier keeps its name. */
function toNeteaseQuality(quality: MusicPlaybackQuality): MusicQuality {
  return quality === "master" ? "jymaster" : quality;
}

function toImmerseType(variant: string | undefined): ImmerseType | undefined {
  return variant !== undefined && IMMERSE_TYPES.has(variant) ? (variant as ImmerseType) : undefined;
}

function toSongId(track: MusicResourceRef<"track">): number | null {
  if (track.provider !== "netease") return null;
  const songId = Number(track.id);
  return Number.isSafeInteger(songId) && songId > 0 ? songId : null;
}

/**
 * Wraps the existing NetEase resolver, which keeps the signed-URL cache and the `/song/url/v1`
 * → grey-match fallback. ReplayGain is stored by the resolver beside a fresh URL, so it is read
 * back here once the URL is known.
 */
export const neteasePlaybackSource: MusicPlaybackSource = {
  async resolvePlayableSource(track, request) {
    const songId = toSongId(track);
    if (songId === null) {
      return { reason: "invalid-netease-song-id", retryable: false, status: "unavailable" };
    }
    const resolution = await webNeteasePlayableSourceResolver.resolve(
      songId,
      toNeteaseQuality(request.quality),
      request.signal,
      toImmerseType(request.variant),
    );
    if (resolution.status !== "resolved") {
      return {
        reason: resolution.reason,
        retryable: resolution.status === "unavailable" && resolution.retryable,
        status: "unavailable",
      };
    }
    if (resolution.source.kind !== "remote") {
      return { reason: "netease-source-not-remote", retryable: false, status: "unavailable" };
    }
    const trackGainDb = await getCachedReplayGain(songId);
    return {
      source: {
        replayGain: trackGainDb !== null && Number.isFinite(trackGainDb) ? { trackGainDb } : null,
        url: resolution.source.url,
      },
      status: "resolved",
    };
  },

  async invalidatePlayableSource(track, request) {
    const songId = toSongId(track);
    if (songId === null) return;
    await webNeteasePlayableSourceResolver.invalidate(
      songId,
      toNeteaseQuality(request.quality),
      toImmerseType(request.variant),
    );
  },
};
