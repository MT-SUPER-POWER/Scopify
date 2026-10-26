"use client";

import { useQuery } from "@tanstack/react-query";
import { getMusicComments } from "@/lib/api/comment";
import { musicQueryKeys } from "@/lib/query/queryKeys";

const HOT_COMMENT_STALE_TIME_MS = 5 * 60 * 1000;

/** 歌曲的前几条精彩评论（没有精彩评论时退回最新评论）与评论总数，供正在播放面板预览。 */
export function useSongHotCommentsQuery(songId: number, limit = 3) {
  return useQuery({
    enabled: songId > 0,
    queryKey: musicQueryKeys.comment.hotPreview(songId, limit),
    queryFn: async () => {
      const response = await getMusicComments({ id: songId, limit, offset: 0 });
      const hot = response.data?.hotComments ?? [];
      return {
        comments: (hot.length > 0 ? hot : (response.data?.comments ?? [])).slice(0, limit),
        total: response.data?.total ?? 0,
      };
    },
    staleTime: HOT_COMMENT_STALE_TIME_MS,
  });
}
