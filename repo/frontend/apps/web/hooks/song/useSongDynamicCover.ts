"use client";

import { useQuery } from "@tanstack/react-query";

import { getSongDynamicCover } from "@/lib/api/track";
import { musicQueryKeys } from "@/lib/query/queryKeys";
import { useUserStore } from "@/store/module/user";

export interface UseSongDynamicCoverOptions {
  enabled?: boolean;
}

/**
 * 歌曲动态封面 Query Hook
 * 登录后调用此接口, 传入歌曲 id, 获取歌曲动态封面
 * @param songId - 歌曲 id
 * @param options - 配置项，可传入 enabled 控制是否启用
 */
export function useSongDynamicCoverQuery(
  songId: number | string | null | undefined,
  options: UseSongDynamicCoverOptions = {},
) {
  const isLogged = useUserStore((state) => Boolean(state.user?.userId));
  const normalizedId = songId ? String(songId) : "";
  const isEnabled = (options.enabled ?? true) && Boolean(normalizedId) && isLogged;

  return useQuery({
    enabled: isEnabled,
    queryKey: musicQueryKeys.song.dynamicCover(normalizedId),
    queryFn: async ({ signal }) => {
      if (!normalizedId) throw new Error("Song ID is required");
      const response = await getSongDynamicCover(normalizedId, signal);
      return response.data;
    },
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
    retry: 1,
  });
}
