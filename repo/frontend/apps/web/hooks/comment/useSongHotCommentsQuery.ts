"use client";

import type { MusicCommentTarget } from "@scopify/music-domain/comment";
import { useQuery } from "@tanstack/react-query";

import { useActiveAccount } from "@/hooks/auth/useProviderAccounts";
import { getMusicProvider } from "@/lib/providers";
import { musicQueryKeys } from "@/lib/query/queryKeys";

const HOT_COMMENT_STALE_TIME_MS = 5 * 60 * 1000;

/**
 * 歌曲的前几条精彩评论（没有精彩评论时退回最新评论）与评论总数，供正在播放面板预览。
 * 评论线程自带平台，读取走它所属平台的 provider。
 */
export function useSongHotCommentsQuery(target: MusicCommentTarget | null, limit = 3) {
  const account = useActiveAccount();
  const accountId = account.profile?.accountId ?? "";
  return useQuery({
    enabled: target !== null && target.id !== "",
    queryKey: musicQueryKeys.comment.hotPreview(
      target?.provider ?? "netease",
      "song",
      target?.id ?? "",
      limit,
      accountId,
    ),
    meta: { persist: true, scope: "account" },
    queryFn: ({ signal }) => {
      if (!target) throw new Error("Comment target is required");
      return getMusicProvider(target.provider).getHotComments(target, limit, signal);
    },
    staleTime: HOT_COMMENT_STALE_TIME_MS,
  });
}
