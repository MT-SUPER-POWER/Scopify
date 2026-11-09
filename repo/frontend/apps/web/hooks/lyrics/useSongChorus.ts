"use client";

import { useQuery } from "@tanstack/react-query";

import { getSongChorus } from "@/lib/providers/netease/api/music";
import { normalizeSongChorusRanges } from "@/lib/lyrics/chorusRanges";
import { musicQueryKeys } from "@/lib/query/queryKeys";

export function useSongChorus(songId: number | string | null) {
  return useQuery({
    // Only NetEase has chorus ranges, and only its song IDs are numeric.
    enabled: songId !== null && /^\d+$/.test(String(songId)),
    meta: {
      persist: true,
      scope: "public",
    },
    queryFn: async ({ signal }) => {
      if (songId === null) throw new Error("Song ID is required.");
      const response = await getSongChorus(songId, signal);
      return normalizeSongChorusRanges(response.data);
    },
    queryKey: musicQueryKeys.song.chorus(songId ?? ""),
    staleTime: Number.POSITIVE_INFINITY,
  });
}
