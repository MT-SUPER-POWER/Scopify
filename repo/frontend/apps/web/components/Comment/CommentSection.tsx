"use client";

import { Check, ListFilter, Loader2 } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";
import { CommentComposer } from "@/components/Comment/CommentComposer";
import {
  CommentCountSkeleton,
  CommentListSkeleton,
} from "@/components/Comment/CommentPageSkeleton";
import { CommentReplies } from "@/components/Comment/CommentReplies";
import { CommentRow } from "@/components/Comment/CommentRow";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCommentThread } from "@/hooks/comment/useCommentThread";
import { getReplyCount } from "@/lib/comment/commentResource";
import { useLoginStatus } from "@/hooks/auth/useLoginStatus";
import { useUserStore } from "@/store";
import { useTranslation } from "react-i18next";

import type { CommentSectionProps } from "@/types/comment/components";
import type { CommentSortType } from "@/types/comment/model";
import type { NeteaseComment } from "@/types/song/api";

const SORT_LABEL_KEY = {
  hot: "comments.sort.default",
  latest: "comments.sort.latest",
} as const;

/**
 * YouTube 式评论区（MV 页与评论页共用）：「N 条评论」与排序方式、常驻输入框、
 * 评论条目内联回复与「N 条回复」楼中楼；滚动到底自动加载下一页。
 * 自己请求评论数据，调用方需要在外面套一层 QueryBoundary：首页评论取不到时只有这一块失败。
 */
export function CommentSection({ resource }: CommentSectionProps) {
  const { t } = useTranslation();
  const isLogin = useLoginStatus();
  const currentUserId = useUserStore((state) => state.user?.userId);
  const {
    closeReply,
    comments,
    hasMore,
    isLoadMoreError,
    isLoadingMore,
    isPending,
    like,
    loadMore,
    openReply,
    remove,
    replyTarget,
    setSort,
    sort,
    submit,
    total,
  } = useCommentThread(resource);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const target = loadMoreRef.current;
    if (!target) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        // 翻页失败后不自动重试，等用户点尾部的「重试」
        if (entry.isIntersecting && hasMore && !isLoadingMore && !isLoadMoreError) loadMore();
      },
      { rootMargin: "300px" },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [hasMore, isLoadMoreError, isLoadingMore, loadMore, isPending]);

  const renderRow = (
    comment: NeteaseComment,
    options: { rootId?: number; compact?: boolean; children?: ReactNode } = {},
  ) => (
    <CommentRow
      key={comment.commentId}
      comment={comment}
      compact={options.compact}
      rootId={options.rootId}
      hasReplies={!options.compact && getReplyCount(comment) > 0}
      isOwn={String(comment.user.userId) === String(currentUserId ?? "")}
      isReplying={replyTarget?.commentId === comment.commentId}
      canReply={isLogin}
      onLike={() => void like(comment)}
      onDelete={() => void remove(comment, options.rootId)}
      onReplyOpen={() => openReply(comment)}
      onReplyCancel={closeReply}
      onReplySubmit={submit}
    >
      {options.children}
    </CommentRow>
  );

  return (
    <section>
      <div className="flex items-center gap-8">
        {isPending ? (
          <CommentCountSkeleton />
        ) : (
          <h2 className="text-xl font-bold text-content">
            {t("mv.comments.count", { count: total, replace: { count: total.toLocaleString() } })}
          </h2>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-2 text-sm font-medium text-content transition-opacity hover:opacity-80"
            >
              <ListFilter className="size-5" />
              {t("mv.comments.sortBy")}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-40">
            {(Object.keys(SORT_LABEL_KEY) as CommentSortType[]).map((value) => (
              <DropdownMenuItem
                key={value}
                onClick={() => setSort(value)}
                className="flex cursor-pointer items-center justify-between"
              >
                {t(SORT_LABEL_KEY[value])}
                {sort === value && <Check className="size-4 text-brand" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="mt-6">
        {isLogin ? (
          <CommentComposer
            placeholder={t("mv.comments.addPlaceholder")}
            submitLabel={t("mv.comments.submit")}
            // 顶部输入与内联回复共用 replyTarget，聚焦顶部时先关掉正在进行的回复
            onFocus={closeReply}
            onSubmit={submit}
          />
        ) : (
          <p className="border-b border-content/20 pb-1 text-sm text-content-muted">
            {t("mv.comments.loginToComment")}
          </p>
        )}
      </div>

      {isPending ? (
        <CommentListSkeleton />
      ) : (
        <>
          <div className="mt-8 flex flex-col gap-6">
            {comments.map((comment) =>
              renderRow(comment, {
                children:
                  getReplyCount(comment) > 0 ? (
                    <CommentReplies
                      resource={resource}
                      parentId={comment.commentId}
                      replyCount={getReplyCount(comment)}
                      renderReply={(reply) =>
                        renderRow(reply, { compact: true, rootId: comment.commentId })
                      }
                    />
                  ) : undefined,
              }),
            )}
            {comments.length === 0 && (
              <p className="py-10 text-center text-sm text-content-subtle">
                {t("comments.page.noComments")}
              </p>
            )}
          </div>

          <div ref={loadMoreRef} className="flex h-16 items-center justify-center">
            {isLoadingMore && <Loader2 className="size-6 animate-spin text-brand" />}
            {isLoadMoreError && !isLoadingMore && (
              <button
                type="button"
                onClick={loadMore}
                className="h-9 rounded-full px-4 text-sm font-medium text-content transition-colors hover:bg-content/10"
              >
                {t("common.action.retry")}
              </button>
            )}
          </div>
        </>
      )}
    </section>
  );
}
