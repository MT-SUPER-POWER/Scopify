"use client";

import { useQuery } from "@tanstack/react-query";

import { useActiveProvider } from "@/hooks/provider/useActiveProvider";
import { musicQueryKeys } from "@/lib/query/queryKeys";

export function useAlbumQuery(albumId: null | string) {
  const provider = useActiveProvider();
  return useQuery({
    enabled: albumId !== null,
    meta: {
      persist: true,
      scope: "public",
    },
    queryFn: ({ signal }) => {
      if (!albumId) throw new Error("Album ID is required.");
      return provider.getAlbum({ provider: provider.provider, kind: "album", id: albumId }, signal);
    },
    queryKey: musicQueryKeys.album.content(provider.provider, albumId ?? ""),
  });
}
