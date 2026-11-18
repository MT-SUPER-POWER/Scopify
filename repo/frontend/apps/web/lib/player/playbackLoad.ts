import { playerTrackKey } from "@/lib/player/trackIdentity";
import type { PlaybackLoadIdentity, PlayerStore } from "@/types/player/model";

/** Rejects async media/lyric results that no longer belong to the active load attempt. */
export function isPlaybackLoadCurrent(
  state: Pick<PlayerStore, "currentTrack" | "playbackLoadRevision">,
  identity: PlaybackLoadIdentity,
) {
  return (
    state.playbackLoadRevision === identity.revision &&
    state.currentTrack !== null &&
    playerTrackKey(state.currentTrack) === identity.trackKey
  );
}
