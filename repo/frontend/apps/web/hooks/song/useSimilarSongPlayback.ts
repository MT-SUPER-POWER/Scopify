"use client";
import { usePlayerStore } from "@/store";
import type { SongDetail } from "@/types/api/music";

export function useSimilarSongPlayback(song: SongDetail, songs: SongDetail[]) {
  const isActive = usePlayerStore((state) => state.currentSongDetail?.id === song.id);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const play = () => {
    const player = usePlayerStore.getState();
    if (player.currentSongDetail?.id === song.id) void player.togglePlaying();
    else void player.playFromSong(song, songs, null);
  };
  return { isActive, isPlaying, play };
}
