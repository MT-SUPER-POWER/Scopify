"use client";

import { useQuery } from "@tanstack/react-query";

import { musicQueryKeys } from "@/lib/query/queryKeys";
import { useUserStore } from "@/store/module/user";
import type { NeteasePlaylist } from "@/types/playlist/api";

/** Observe the library's existing query without starting another request. */
export function useSocialPickerPlaylists() {
  const userId = useUserStore((state) => state.user?.userId);
  return useQuery<NeteasePlaylist[]>({
    enabled: false,
    queryKey: musicQueryKeys.library.playlists(userId ?? 0),
  });
}
