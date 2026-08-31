"use client";

import { useCallback } from "react";
import { toCommandWorkspaceSongDetail } from "@/lib/commandWorkspace/trackList";
import { toVoiceSongDetail } from "@/lib/search/voiceSong";
import { usePlayerStore } from "@/store";
import type { SongDetail } from "@/types/api/music";
import type { Song, Voice } from "@/types/search";

export function useCommandWorkspacePlayback() {
  const appendQueueItems = usePlayerStore((state) => state.appendQueueItems);
  const moveQueueItemToNext = usePlayerStore((state) => state.moveQueueItemToNext);
  const playQueueIndex = usePlayerStore((state) => state.playQueueIndex);
  const setQueue = usePlayerStore((state) => state.setQueue);

  const playTracks = useCallback(
    async (tracks: SongDetail[], index = 0) => {
      if (tracks.length === 0) return;
      setQueue(tracks, index);
      await playQueueIndex(index);
    },
    [playQueueIndex, setQueue],
  );

  const appendTracks = useCallback(
    (tracks: SongDetail[]) => {
      if (tracks.length === 0) return;
      appendQueueItems(tracks);
    },
    [appendQueueItems],
  );

  const insertTracksNext = useCallback(
    (tracks: SongDetail[]) => {
      if (tracks.length === 0) return;
      const previousLength = usePlayerStore.getState().queue.length;
      appendQueueItems(tracks);
      for (let index = tracks.length - 1; index >= 0; index -= 1) {
        moveQueueItemToNext(previousLength + index);
      }
    },
    [appendQueueItems, moveQueueItemToNext],
  );

  const playSong = useCallback(
    async (song: Song, songs: Song[]) => {
      const tracks = songs.map(toCommandWorkspaceSongDetail);
      const index = songs.findIndex((candidate) => candidate.id === song.id);
      await playTracks(tracks, Math.max(index, 0));
    },
    [playTracks],
  );

  const playVoice = useCallback(
    async (voice: Voice, voices: Voice[]) => {
      if (!voice.mainSong || voice.isPlayable === false) return;
      const playableVoices = voices.filter(
        (candidate): candidate is Voice & { mainSong: Song } =>
          candidate.mainSong !== null && candidate.isPlayable !== false,
      );
      const tracks = playableVoices.map((candidate) =>
        toVoiceSongDetail(candidate.mainSong, candidate.coverUrl, candidate.id),
      );
      const index = playableVoices.findIndex((candidate) => candidate.id === voice.id);
      await playTracks(tracks, Math.max(index, 0));
    },
    [playTracks],
  );

  return { appendTracks, insertTracksNext, playSong, playTracks, playVoice };
}
