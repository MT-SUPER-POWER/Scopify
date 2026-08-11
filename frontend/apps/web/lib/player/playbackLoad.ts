import type { PlaybackLoadIdentity, PlayerStore } from "@/types/player";

/** Rejects async media/lyric results that no longer belong to the active load attempt. */
export function isPlaybackLoadCurrent(
  state: Pick<PlayerStore, "currentSongDetail" | "playbackLoadRevision">,
  identity: PlaybackLoadIdentity,
) {
  return (
    state.playbackLoadRevision === identity.revision &&
    state.currentSongDetail?.id === identity.trackId
  );
}
