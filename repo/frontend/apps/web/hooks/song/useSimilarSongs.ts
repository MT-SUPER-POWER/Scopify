"use client";
import { useQuery } from "@tanstack/react-query";
import {
  getSimilarSongDetails,
  getSimilarSongList,
  getSimilarSongs,
} from "@/lib/api/similarSongs";
import { musicQueryKeys } from "@/lib/query/queryKeys";
import { getSimilarSongIds } from "@/lib/song/similarSongs";
import { useUserStore } from "@/store";
import { pruneSongDetail } from "@/types/api/music";

export function useSimilarSongs(songId: number, open: boolean) {
  const userId = useUserStore((state) => state.user?.userId ?? 0);
  return useQuery({
    queryKey: musicQueryKeys.song.similar(songId, userId),
    enabled: open && songId > 0,
    staleTime: 60_000,
    retry: false,
    queryFn: async ({ signal }) => {
      const response = await getSimilarSongs(songId, signal);
      if (response.data.data === undefined)
        throw new Error("Missing similar-song resource response");
      let ids = getSimilarSongIds(response.data.data, songId);
      if (ids.length === 0) {
        const fallback = await getSimilarSongList(songId, signal);
        if (!Array.isArray(fallback.data.songs))
          throw new Error("Missing similar-song list response");
        ids = getSimilarSongIds(
          { songIds: fallback.data.songs.map((song) => song.id) },
          songId,
        );
      }
      if (ids.length === 0) return [];
      const detail = await getSimilarSongDetails(ids, signal);
      if (!Array.isArray(detail.data.songs)) throw new Error("Missing recommended song details");
      const privileges = new Map((detail.data.privileges ?? []).map((item) => [item.id, item]));
      const songs = new Map(
        detail.data.songs.map((raw) => [
          raw.id,
          pruneSongDetail({
            ...raw,
            privilege: privileges.get(raw.id) ?? raw.privilege,
          }),
        ]),
      );
      return ids.flatMap((id) => {
        const song = songs.get(id);
        return song ? [song] : [];
      });
    },
  });
}
