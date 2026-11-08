"use client";
import { usePlayerStore } from "@/store";
import type { SongDetail } from "@/types/song/api";
import { adaptNeteaseTrack, getNeteaseTrackId } from "@/lib/providers/netease/adapters/track";

export function useSimilarSongPlayback(song: SongDetail, songs: SongDetail[]) {
  const isActive = usePlayerStore((state) => getNeteaseTrackId(state.currentTrack) === song.id);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const play = () => {
    const player = usePlayerStore.getState();
    if (getNeteaseTrackId(player.currentTrack) === song.id) void player.togglePlaying();
    else void player.playFromSong(adaptNeteaseTrack(song), songs.map(adaptNeteaseTrack), null);
  };
  return { isActive, isPlaying, play };
}
