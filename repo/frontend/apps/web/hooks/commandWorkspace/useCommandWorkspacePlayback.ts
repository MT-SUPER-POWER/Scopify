"use client";

import { useCallback } from "react";
import { toVoiceSongDetail } from "@/lib/search/voiceSong";
import { usePlayerStore } from "@/store";
import { musicResourceKey } from "@scopify/music-domain/identity";
import type { PlayerTrack } from "@/types/player/model";
import type { Song, Voice } from "@/types/search/model";
import { adaptNeteaseTrack } from "@/lib/providers/netease/adapters/track";

export function useCommandWorkspacePlayback() {
  const appendQueueItems = usePlayerStore((state) => state.appendQueueItems);
  const moveQueueItemToNext = usePlayerStore((state) => state.moveQueueItemToNext);
  const playQueueIndex = usePlayerStore((state) => state.playQueueIndex);
  const setQueue = usePlayerStore((state) => state.setQueue);

  const playTracks = useCallback(
    async (tracks: PlayerTrack[], index = 0) => {
      if (tracks.length === 0) return;
      setQueue(tracks, index);
      await playQueueIndex(index);
    },
    [playQueueIndex, setQueue],
  );

  const appendTracks = useCallback(
    (tracks: PlayerTrack[]) => {
      if (tracks.length === 0) return;
      appendQueueItems(tracks);
    },
    [appendQueueItems],
  );

  const insertTracksNext = useCallback(
    (tracks: PlayerTrack[]) => {
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
    async (song: PlayerTrack, songs: PlayerTrack[]) => {
      const key = musicResourceKey(song.ref);
      const index = songs.findIndex((candidate) => musicResourceKey(candidate.ref) === key);
      await playTracks(songs, Math.max(index, 0));
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
        adaptNeteaseTrack(toVoiceSongDetail(candidate.mainSong, candidate.coverUrl, candidate.id)),
      );
      const index = playableVoices.findIndex((candidate) => candidate.id === voice.id);
      await playTracks(tracks, Math.max(index, 0));
    },
    [playTracks],
  );

  return { appendTracks, insertTracksNext, playSong, playTracks, playVoice };
}
