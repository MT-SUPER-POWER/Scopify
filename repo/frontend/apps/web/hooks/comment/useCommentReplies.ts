"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { useCommentTarget } from "@/hooks/comment/useCommentTarget";
import { useActiveAccount } from "@/hooks/auth/useProviderAccounts";
import { useActiveProvider } from "@/hooks/provider/useActiveProvider";
import { dedupeComments } from "@/lib/comment/commentResource";
import { musicQueryKeys } from "@/lib/query/queryKeys";
import type { CommentRepliesPageParam, CommentResource } from "@/types/comment/model";

/** 首页少取几条（足够露出第一位回复者的头像、展开即看），之后每次多取一些。 */
const FIRST_PAGE_LIMIT = 5;
const NEXT_PAGE_LIMIT = 10;

/**
 * 一层楼（某条评论）下的回复（平台有 comments.replies 时）。`enabled` 由调用方决定：
 * 条目进入视口或被展开时才取。回复是评论区里的附属内容：失败不抛给边界，由楼层原地显示重试。
 */
export function useCommentReplies(resource: CommentResource, rootId: string, enabled: boolean) {
  const provider = useActiveProvider();
  const account = useActiveAccount();
  const target = useCommentTarget(resource);
  const accountId = account.profile?.accountId ?? "";
  const query = useInfiniteQuery({
    queryKey: musicQueryKeys.comment.replies(
      provider.provider,
      accountId,
      resource.kind,
      resource.id,
      rootId,
    ),
    queryFn: ({ pageParam, signal }) => {
      if (!provider.getCommentReplies) throw new Error("Comment replies are unsupported.");
      return provider.getCommentReplies(target, rootId, {
        ...(pageParam.cursor === undefined ? {} : { cursor: pageParam.cursor }),
        pageSize: pageParam.limit,
        signal,
      });
    },
    initialPageParam: { limit: FIRST_PAGE_LIMIT } as CommentRepliesPageParam,
    getNextPageParam: (lastPage): CommentRepliesPageParam | undefined =>
      lastPage.hasMore
        ? {
            limit: NEXT_PAGE_LIMIT,
            ...(lastPage.nextCursor === null ? {} : { cursor: lastPage.nextCursor }),
          }
        : undefined,
    enabled: enabled && provider.getCommentReplies !== undefined,
  });

  const replies = useMemo(
    () => dedupeComments(query.data?.pages.flatMap((page) => page.comments) ?? []),
    [query.data],
  );

  return {
    replies,
    hasResult: query.data !== undefined,
    /** 一条都还没取到就失败了；已经有回复时，翻页失败另见 isLoadMoreError。 */
    isError: query.data === undefined && query.isError,
    isLoadMoreError: query.isFetchNextPageError,
    isLoading: query.isPending && query.fetchStatus === "fetching",
    isLoadingMore: query.isFetchingNextPage,
    hasMore: query.hasNextPage,
    loadMore: () => void query.fetchNextPage(),
    retry: () => void query.refetch(),
  };
}
