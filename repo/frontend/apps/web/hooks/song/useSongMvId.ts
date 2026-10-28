"use client";

import { useQuery } from "@tanstack/react-query";
import { getSongDetail } from "@/lib/api/track";
import { musicQueryKeys } from "@/lib/query/queryKeys";
import type { RawSongDetail, SongDetail } from "@/types/song/api";

/**
 * 歌曲关联的 MV id（没有时为 0）。新数据直接带 mv 字段；
 * 队列与本地缓存里的旧歌曲对象没有该字段，按需补查一次歌曲详情。
 */
export function useSongMvId(song: SongDetail) {
  const needsLookup = song.mv === undefined && song.id > 0;
  const query = useQuery({
    enabled: needsLookup,
    queryKey: musicQueryKeys.song.mvId(song.id),
    queryFn: async () => {
      const response = await getSongDetail(song.id);
      const raw = (response.data as { songs?: RawSongDetail[] } | undefined)?.songs?.[0];
      return raw?.mv || raw?.mvid || 0;
    },
    staleTime: Infinity,
  });
  return song.mv ?? query.data ?? 0;
}
