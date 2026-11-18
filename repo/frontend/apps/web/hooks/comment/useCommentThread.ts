"use client";

import type { MusicComment } from "@scopify/music-domain/comment";
import { type InfiniteData, useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

import { useCommentTarget } from "@/hooks/comment/useCommentTarget";
import { useActiveAccount } from "@/hooks/auth/useProviderAccounts";
import { useActiveProvider } from "@/hooks/provider/useActiveProvider";
import { dedupeComments, mapCommentPages, toggleCommentLiked } from "@/lib/comment/commentResource";
import { throwQueryErrorWithoutData } from "@/lib/query/errorPolicy";
import { musicQueryKeys } from "@/lib/query/queryKeys";
import type { CommentListPageParam, CommentResource, CommentSortType } from "@/types/comment/model";

const PAGE_SIZE = 20;
/** 网易云评论的字数上限。 */
const MAX_LENGTH = 140;

type CommentPages = InfiniteData<{ comments: MusicComment[] }>;

/**
 * 一个资源下的评论区：分页列表、排序、点赞、删除、发表与回复。
 * 首页失败交给评论区自己的边界，翻页失败保留已加载的评论、在列表尾部重试。
 * 点赞、删除、发表是用户操作（平台有 comments.write 时才有），反馈留在操作本身，
 * 成功后直接改写这个资源下的所有评论缓存（列表与各层楼）。
 */
export function useCommentThread(resource: CommentResource) {
  const { t } = useTranslation();
  const provider = useActiveProvider();
  const account = useActiveAccount();
  const queryClient = useQueryClient();
  const target = useCommentTarget(resource);
  const accountId = account.profile?.accountId ?? "";
  const [sort, setSort] = useState<CommentSortType>("hot");
  // 正在回复的评论；顶部输入框与各条评论下的内联回复共用，同一时间只开一个
  const [replyTarget, setReplyTarget] = useState<MusicComment | null>(null);
  const threadKey = useMemo(
    () => musicQueryKeys.comment.thread(provider.provider, accountId, resource.kind, resource.id),
    [accountId, provider.provider, resource.id, resource.kind],
  );

  const listQuery = useInfiniteQuery({
    queryKey: musicQueryKeys.comment.list(
      provider.provider,
      accountId,
      resource.kind,
      resource.id,
      sort,
    ),
    queryFn: ({ pageParam, signal }) =>
      provider.getComments(target, {
        sort,
        pageNo: pageParam.pageNo,
        ...(pageParam.cursor === undefined ? {} : { cursor: pageParam.cursor }),
        pageSize: PAGE_SIZE,
        signal,
      }),
    initialPageParam: { pageNo: 1 } as CommentListPageParam,
    getNextPageParam: (lastPage, pages): CommentListPageParam | undefined =>
      lastPage.hasMore
        ? {
            ...(lastPage.nextCursor === null ? {} : { cursor: lastPage.nextCursor }),
            pageNo: pages.length + 1,
          }
        : undefined,
    throwOnError: throwQueryErrorWithoutData,
  });

  const comments = useMemo(
    () => dedupeComments(listQuery.data?.pages.flatMap((page) => page.comments) ?? []),
    [listQuery.data],
  );

  /** 改写这个资源下所有已缓存的评论页（各排序的列表与各层楼的回复）。 */
  const updateCachedComments = useCallback(
    (update: (comments: MusicComment[]) => MusicComment[]) =>
      queryClient.setQueriesData<CommentPages>({ queryKey: threadKey }, (data) =>
        mapCommentPages(data, update),
      ),
    [queryClient, threadKey],
  );

  const countKey = musicQueryKeys.comment.count(provider.provider, resource.kind, resource.id);

  /** 发表、删除之后：重新拉这个资源的评论，顺带刷新别处显示的评论数。 */
  const refreshThread = useCallback(
    () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: threadKey }),
        queryClient.invalidateQueries({ queryKey: countKey }),
      ]),
    [countKey, queryClient, threadKey],
  );

  const like = useCallback(
    async (comment: MusicComment) => {
      if (!provider.setCommentLiked) return;
      const toggle = (list: MusicComment[]) =>
        list.map((item) => (item.id === comment.id ? toggleCommentLiked(item) : item));
      // 先改界面，失败再改回来
      updateCachedComments(toggle);
      try {
        await provider.setCommentLiked(target, comment.id, !comment.liked);
        toast.success(
          comment.liked ? t("comments.page.unlikeSuccess") : t("comments.page.likeSuccess"),
        );
      } catch (error) {
        console.error("Failed to toggle comment like:", error);
        updateCachedComments(toggle);
        toast.error(t("common.message.requestFailed", { message: "" }));
      }
    },
    [provider, t, target, updateCachedComments],
  );

  const remove = useCallback(
    async (comment: MusicComment, rootId?: string) => {
      if (!provider.deleteComment) return;
      try {
        await provider.deleteComment(target, comment.id);
        updateCachedComments((list) =>
          list
            .filter((item) => item.id !== comment.id)
            .map((item) =>
              rootId !== undefined && item.id === rootId
                ? { ...item, replyCount: Math.max(0, item.replyCount - 1) }
                : item,
            ),
        );
        toast.success(t("comments.page.deleted"));
        void queryClient.invalidateQueries({ queryKey: countKey });
      } catch (error) {
        console.error("Failed to delete comment:", error);
        toast.error(t("common.message.requestFailed", { message: "" }));
      }
    },
    [countKey, provider, queryClient, t, target, updateCachedComments],
  );

  const closeReply = useCallback(() => setReplyTarget(null), []);

  /** 发表评论或回复 replyTarget；返回是否成功，成功后输入框清空。 */
  const submit = useCallback(
    async (text: string) => {
      if (!text.trim() || text.length > MAX_LENGTH) return false;
      if (!account.isLoggedIn) {
        toast.error(t("comments.page.loginRequired"));
        return false;
      }
      if (!provider.addComment || !provider.replyToComment) return false;

      try {
        if (replyTarget) {
          await provider.replyToComment(target, replyTarget.id, text);
          toast.success(t("comments.page.replySuccess"));
        } else {
          await provider.addComment(target, text);
          toast.success(t("comments.page.publishSuccess"));
          // 刚发的评论按时间排在最前
          setSort("latest");
        }
        closeReply();
        await refreshThread();
        return true;
      } catch (error) {
        console.error("Failed to submit comment:", error);
        toast.error(t("common.message.requestFailed", { message: "" }));
        return false;
      }
    },
    [account.isLoggedIn, closeReply, provider, refreshThread, replyTarget, t, target],
  );

  return {
    closeReply,
    comments,
    hasMore: listQuery.hasNextPage,
    isLoadMoreError: listQuery.isFetchNextPageError,
    isLoadingMore: listQuery.isFetchingNextPage,
    isPending: listQuery.isPending,
    like,
    loadMore: () => void listQuery.fetchNextPage(),
    openReply: setReplyTarget,
    remove,
    replyTarget,
    setSort,
    sort,
    submit,
    total: listQuery.data?.pages[0]?.total ?? 0,
  };
}
