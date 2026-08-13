import type { PlayerStore } from "@/types/player";

export interface ExternalPlaybackSourceIdentity {
  loadRevision: number;
  sourceUrl: string;
}

/**
 * The Host must begin waiting before React's source effect writes `audio.src`.
 * Therefore source preparation is guarded by the canonical Store identity, not
 * by the audio element's later-applied load revision.
 */
export function isExternalPlaybackSourceCurrent(
  player: Pick<PlayerStore, "currentSongUrl" | "playbackLoadRevision">,
  identity: ExternalPlaybackSourceIdentity,
): boolean {
  return (
    player.currentSongUrl === identity.sourceUrl &&
    player.playbackLoadRevision === identity.loadRevision
  );
}
