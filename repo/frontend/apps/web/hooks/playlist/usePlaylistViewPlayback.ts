"use client";

import { useCallback, useMemo } from "react";
import { usePlaybackCommands } from "@/hooks/player/usePlaybackCommands";
import {
  usePlaybackProjection,
  usePlaybackProjectionStore,
} from "@/hooks/player/usePlaybackProjection";
import { usePlayerStore } from "@/store";
import { playbackTrackId } from "@/lib/player/trackIdentity";
import type { PlaylistViewPlaybackOptions } from "@/types/playlist/latticeComponents";

/** Playback bindings shared by the immersive playlist views: which card is current, and what playing it does. */
export function usePlaylistViewPlayback({
  tracks,
  sourceId,
  onTrackPlay,
  playbackQueue,
}: PlaylistViewPlaybackOptions) {
  const playback = usePlaybackProjection();
  const projectionStore = usePlaybackProjectionStore();
  const commands = usePlaybackCommands();
  const queueSource = usePlayerStore((state) => state.playlistId);
  const liveIndex = usePlayerStore((state) => (state.queue === tracks ? state.queueIndex : null));
  const trackId = playback.track?.id;
  const currentIndex = useMemo(() => {
    if (liveIndex !== null) return liveIndex;
    if (playbackQueue || queueSource !== sourceId || trackId === undefined) return -1;
    return tracks.findIndex((track) => playbackTrackId(track) === trackId);
  }, [liveIndex, playbackQueue, queueSource, sourceId, trackId, tracks]);
  const playAt = useCallback(
    (index: number, resumeOnly = false) => {
      const track = tracks[index];
      if (!track) return;
      const latest = projectionStore.getSnapshot();
      const player = usePlayerStore.getState();
      const liveQueue = player.queue === tracks;
      if (playbackQueue && !liveQueue) return;
      const current = liveQueue
        ? index === player.queueIndex
        : player.playlistId === sourceId && playbackTrackId(track) === latest.track?.id;
      if (current) {
        if (!resumeOnly) void commands.toggle();
        else if (!latest.isPlaying) void commands.play();
      } else if (liveQueue) void commands.playQueueIndex(index);
      else if (onTrackPlay) onTrackPlay(track);
      else void player.playFromSong(track, tracks, sourceId);
    },
    [commands, onTrackPlay, playbackQueue, projectionStore, sourceId, tracks],
  );
  return { currentIndex, isPlaying: playback.isPlaying, playAt };
}
