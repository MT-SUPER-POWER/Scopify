"use client";

import { useQuery } from "@tanstack/react-query";

import { getAlbumDetailData } from "@/lib/api/album";
import { musicQueryKeys } from "@/lib/query/queryKeys";

export function useAlbumQuery(albumId: null | string) {
  return useQuery({
    enabled: albumId !== null,
    meta: {
      persist: true,
      scope: "public",
    },
    queryFn: ({ signal }) => {
      if (!albumId) throw new Error("Album ID is required.");
      return getAlbumDetailData(albumId, signal);
    },
    queryKey: musicQueryKeys.album.detail(albumId ?? ""),
  });
}
