"use client";

import { useQuery } from "@tanstack/react-query";

import { getUserAlbumSublist } from "@/lib/api/album";
import { useLoginStatus } from "@/lib/hooks/useLoginStatus";
import { musicQueryKeys } from "@/lib/query/queryKeys";
import { useUserStore } from "@/store";
import type { AlbumSublistResponse } from "@/types/api/album";

export function getCollectedAlbumIds(response: AlbumSublistResponse) {
  return (response.data ?? []).map((album) => album.id);
}

export function useAlbumCollectionQuery() {
  const isLoggedIn = useLoginStatus();
  const userId = useUserStore((state) => state.user?.userId);

  return useQuery({
    enabled: isLoggedIn && Boolean(userId),
    meta: {
      persist: true,
      scope: "account",
    },
    queryFn: async () => getCollectedAlbumIds((await getUserAlbumSublist({ limit: 100 })).data),
    queryKey: musicQueryKeys.album.subscriptions(userId ?? 0),
  });
}
