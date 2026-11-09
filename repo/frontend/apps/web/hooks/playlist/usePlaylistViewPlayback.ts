"use client";

import { useCallback } from "react";
import { usePlaybackCommands } from "@/hooks/player/usePlaybackCommands";
import { usePlaybackProjection } from "@/hooks/player/usePlaybackProjection";
import { usePlayerStore } from "@/store";
import { playbackTrackId } from "@/lib/player/trackIdentity";
import type { PlayerTrack } from "@/types/player/model";

interface PlaylistViewPlaybackOptions {
  tracks: PlayerTrack[];
  sourceId: string | null;
  onTrackPlay?: (track: PlayerTrack) => void;
}

/** Playback bindings shared by the immersive playlist views: which card is current, and what playing it does. */
export function usePlaylistViewPlayback({
  tracks,
  sourceId,
  onTrackPlay,
}: PlaylistViewPlaybackOptions) {
  const playback = usePlaybackProjection();
  const commands = usePlaybackCommands();
  const queueSource = usePlayerStore((state) => state.playlistId);
  const playFromSong = usePlayerStore((state) => state.playFromSong);
  const currentIndex =
    queueSource === sourceId
      ? tracks.findIndex((track) => playbackTrackId(track) === playback.track?.id)
      : -1;
  const play = useCallback(
    (track: PlayerTrack) => {
      if (queueSource === sourceId && playbackTrackId(track) === playback.track?.id)
        void commands.toggle();
      else if (onTrackPlay) onTrackPlay(track);
      // A page's tracks come back as the queue entries they were listed as.
      else void playFromSong(track, tracks, sourceId);
    },
    [commands, onTrackPlay, playback.track?.id, playFromSong, queueSource, sourceId, tracks],
  );
  return { currentIndex, isPlaying: playback.isPlaying, play };
}
