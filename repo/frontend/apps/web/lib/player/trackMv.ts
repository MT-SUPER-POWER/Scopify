import type { MusicResourceRef } from "@scopify/music-domain/identity";

import type { PlayerTrack } from "@/types/player/model";

/** The MV of a track as a reference, whichever platform it is on; null when it has none. */
export function trackMvRef(track: PlayerTrack): MusicResourceRef<"mv"> | null {
  const id = track.netease ? (track.netease.mv ? String(track.netease.mv) : null) : track.mvId;
  return id ? { provider: track.ref.provider, kind: "mv", id } : null;
}
