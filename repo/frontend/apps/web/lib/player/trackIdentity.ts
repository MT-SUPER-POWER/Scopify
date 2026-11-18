import { musicResourceKey } from "@scopify/music-domain/identity";
import type { MusicTrack } from "@scopify/music-domain/track";

/** Queue identity of a track: the same native ID on two platforms never matches. */
export function playerTrackKey(track: MusicTrack): string {
  return musicResourceKey(track.ref);
}

export function isSamePlayerTrack(
  a: MusicTrack | null | undefined,
  b: MusicTrack | null | undefined,
): boolean {
  return a != null && b != null && a.ref.provider === b.ref.provider && a.ref.id === b.ref.id;
}

/**
 * Track ID sent across the desktop contract: NetEase keeps its numeric song ID, which desktop
 * lyrics and MCP rely on; other platforms send "provider:id".
 */
export function playbackTrackId(track: MusicTrack): number | string {
  if (track.ref.provider === "netease") {
    const id = Number(track.ref.id);
    if (Number.isSafeInteger(id)) return id;
  }
  return `${track.ref.provider}:${track.ref.id}`;
}
