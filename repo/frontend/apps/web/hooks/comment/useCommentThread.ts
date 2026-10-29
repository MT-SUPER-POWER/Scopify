"use client";

import { type InfiniteData, useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  addResourceComment,
  delComments,
  getNewComments,
  replyComments,
  toggleLikeComments,
} from "@/lib/api/comment";
import {
  dedupeComments,
  getReplyCount,
  mapCommentPages,
  normalizeNewComments,
  toggleCommentLiked,
} from "@/lib/comment/commentResource";
import { useLoginStatus } from "@/hooks/auth/useLoginStatus";
import { throwQueryErrorWithoutData } from "@/lib/query/errorPolicy";
import { musicQueryKeys } from "@/lib/query/queryKeys";
import { useI18n } from "@/store/module/i18n";
import { useUserStore } from "@/store/module/user";
import type { CommentResource } from "@/types/comment/api";
import type { CommentListPage, CommentListPageParam, CommentSortType } from "@/types/comment/model";
import type { NeteaseComment } from "@/types/song/api";

const PAGE_SIZE = 20;
/** 网易云评论的字数上限。 */
const MAX_LENGTH = 140;
/** /comment/new 的 sortType：1 推荐（热度在前），3 按时间。 */
const SORT_TYPE = { hot: 1, latest: 3 } as const;

type CommentPages = InfiniteData<{ comments: NeteaseComment[] }>;

/**
 * 一个资源下的评论区：分页列表、排序、点赞、删除、发表与回复。
 * 列表走 /comment/new（只有它带回复数）；首页失败交给评论区自己的边界，
 * 翻页失败保留已加载的评论、在列表尾部重试。点赞、删除、发表是用户操作，
 * 反馈留在操作本身，成功后直接改写这个资源下的所有评论缓存（列表与各层楼）。
 */
export function useCommentThread(resource: CommentResource) {
  const { t } = useI18n();
  const isLogin = useLoginStatus();
  const queryClient = useQueryClient();
  const accountId = String(useUserStore((state) => state.user?.userId ?? ""));
  const [sort, setSort] = useState<CommentSortType>("hot");
  // 正在回复的评论；顶部输入框与各条评论下的内联回复共用，同一时间只开一个
  const [replyTarget, setReplyTarget] = useState<NeteaseComment | null>(null);
  const threadKey = useMemo(
    () => musicQueryKeys.comment.thread(accountId, resource.kind, resource.id),
    [accountId, resource.id, resource.kind],
  );

  const listQuery = useInfiniteQuery({
    queryKey: musicQueryKeys.comment.list(accountId, resource.kind, resource.id, sort),
    queryFn: async ({ pageParam }): Promise<CommentListPage> =>
      normalizeNewComments(
        (
          await getNewComments({
            cursor: pageParam.cursor,
            id: resource.id,
            pageNo: pageParam.pageNo,
            pageSize: PAGE_SIZE,
            sortType: SORT_TYPE[sort],
            type: resource.type,
          })
        ).data,
      ),
    initialPageParam: { pageNo: 1 } as CommentListPageParam,
    getNextPageParam: (lastPage, pages): CommentListPageParam | undefined =>
      lastPage.hasMore ? { cursor: lastPage.cursor, pageNo: pages.length + 1 } : undefined,
    throwOnError: throwQueryErrorWithoutData,
  });

  const comments = useMemo(
    () => dedupeComments(listQuery.data?.pages.flatMap((page) => page.comments) ?? []),
    [listQuery.data],
  );

  /** 改写这个资源下所有已缓存的评论页（各排序的列表与各层楼的回复）。 */
  const updateCachedComments = useCallback(
    (update: (comments: NeteaseComment[]) => NeteaseComment[]) =>
      queryClient.setQueriesData<CommentPages>({ queryKey: threadKey }, (data) =>
        mapCommentPages(data, update),
      ),
    [queryClient, threadKey],
  );

  /** 发表、删除之后：重新拉这个资源的评论，顺带刷新别处显示的评论数。 */
  const refreshThread = useCallback(
    () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: threadKey }),
        queryClient.invalidateQueries({
          queryKey: musicQueryKeys.comment.count(resource.kind, resource.id),
        }),
      ]),
    [queryClient, resource.id, resource.kind, threadKey],
  );

  const like = useCallback(
    async (comment: NeteaseComment) => {
      const toggle = (list: NeteaseComment[]) =>
        list.map((item) =>
          item.commentId === comment.commentId ? toggleCommentLiked(item) : item,
        );
      // 先改界面，失败再改回来
      updateCachedComments(toggle);
      try {
        await toggleLikeComments(
          resource.id,
          comment.commentId,
          comment.liked ? 0 : 1,
          resource.type,
        );
        toast.success(
          comment.liked ? t("comments.page.unlikeSuccess") : t("comments.page.likeSuccess"),
        );
      } catch (error) {
        console.error("Failed to toggle comment like:", error);
        updateCachedComments(toggle);
        toast.error(t("common.message.requestFailed", { message: "" }));
      }
    },
    [resource.id, resource.type, t, updateCachedComments],
  );

  const remove = useCallback(
    async (comment: NeteaseComment, rootId?: number) => {
      try {
        await delComments(resource.id, comment.commentId, resource.type);
        updateCachedComments((list) =>
          list
            .filter((item) => item.commentId !== comment.commentId)
            .map((item) =>
              rootId !== undefined && item.commentId === rootId
                ? {
                    ...item,
                    showFloorComment: { replyCount: Math.max(0, getReplyCount(item) - 1) },
                  }
                : item,
            ),
        );
        toast.success(t("comments.page.deleted"));
        void queryClient.invalidateQueries({
          queryKey: musicQueryKeys.comment.count(resource.kind, resource.id),
        });
      } catch (error) {
        console.error("Failed to delete comment:", error);
        toast.error(t("common.message.requestFailed", { message: "" }));
      }
    },
    [queryClient, resource.id, resource.kind, resource.type, t, updateCachedComments],
  );

  const closeReply = useCallback(() => setReplyTarget(null), []);

  /** 发表评论或回复 replyTarget；返回是否成功，成功后输入框清空。 */
  const submit = useCallback(
    async (text: string) => {
      if (!text.trim() || text.length > MAX_LENGTH) return false;
      if (!isLogin) {
        toast.error(t("comments.page.loginRequired"));
        return false;
      }

      try {
        if (replyTarget) {
          await replyComments(resource.id, replyTarget.commentId, text, resource.type);
          toast.success(t("comments.page.replySuccess"));
        } else {
          await addResourceComment(resource.id, text, resource.type);
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
    [closeReply, isLogin, refreshThread, replyTarget, resource.id, resource.type, t],
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
