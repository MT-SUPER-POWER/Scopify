"use client";

import { useCallback } from "react";
import { usePlaybackCommands } from "@/hooks/player/usePlaybackCommands";
import {
  usePlaybackProjection,
  usePlaybackProjectionStore,
} from "@/hooks/player/usePlaybackProjection";
import { usePlayerStore } from "@/store";
import type { PlaylistViewPlaybackOptions } from "@/types/playlist/latticeComponents";

/** Playback bindings shared by the immersive playlist views: which card is current, and what playing it does. */
export function usePlaylistViewPlayback({
  tracks,
  sourceId,
  onTrackPlay,
}: PlaylistViewPlaybackOptions) {
  const playback = usePlaybackProjection();
  const projectionStore = usePlaybackProjectionStore();
  const commands = usePlaybackCommands();
  const queueSource = usePlayerStore((state) => state.playlistId);
  const currentIndex =
    queueSource === sourceId ? tracks.findIndex((track) => track.id === playback.track?.id) : -1;
  const play = useCallback(
    (track: (typeof tracks)[number], resumeOnly = false) => {
      const latest = projectionStore.getSnapshot();
      const player = usePlayerStore.getState();
      if (player.playlistId === sourceId && track.id === latest.track?.id) {
        if (!resumeOnly) void commands.toggle();
        else if (!latest.isPlaying) void commands.play();
      } else if (onTrackPlay) onTrackPlay(track);
      else void player.playFromSong(track, tracks, sourceId);
    },
    [commands, onTrackPlay, projectionStore, sourceId, tracks],
  );
  return { currentIndex, isPlaying: playback.isPlaying, play };
}
