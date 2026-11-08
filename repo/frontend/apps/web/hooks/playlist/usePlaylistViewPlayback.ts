"use client";

import { useCallback } from "react";
import { usePlaybackCommands } from "@/hooks/player/usePlaybackCommands";
import { usePlaybackProjection } from "@/hooks/player/usePlaybackProjection";
import { usePlayerStore } from "@/store";
import type { SongDetail } from "@/types/song/api";
import { toNeteasePlayerTrack } from "@/lib/providers/netease/adapters/track";

interface PlaylistViewPlaybackOptions {
  tracks: SongDetail[];
  sourceId: string | null;
  onTrackPlay?: (track: SongDetail) => void;
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
    queueSource === sourceId ? tracks.findIndex((track) => track.id === playback.track?.id) : -1;
  const play = useCallback(
    (track: SongDetail) => {
      if (queueSource === sourceId && track.id === playback.track?.id) void commands.toggle();
      else if (onTrackPlay) onTrackPlay(track);
      // A page's tracks come back as the queue entries they were listed as.
      else
        void playFromSong(toNeteasePlayerTrack(track), tracks.map(toNeteasePlayerTrack), sourceId);
    },
    [commands, onTrackPlay, playback.track?.id, playFromSong, queueSource, sourceId, tracks],
  );
  return { currentIndex, isPlaying: playback.isPlaying, play };
}
