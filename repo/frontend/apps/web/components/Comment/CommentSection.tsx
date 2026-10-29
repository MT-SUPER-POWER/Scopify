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
import { getReplyCount } from "@/lib/comment/commentResource";
import { useLoginStatus } from "@/lib/hooks/useLoginStatus";
import { useUserStore } from "@/store";
import { useI18n } from "@/store/module/i18n";
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
 */
export function CommentSection({ data }: CommentSectionProps) {
  const { t } = useI18n();
  const isLogin = useLoginStatus();
  const currentUserId = useUserStore((state) => state.user?.userId);
  const {
    comments,
    handleDelete,
    handleLike,
    handleReply,
    handleSubmitComment,
    hasMore,
    isFirstPageLoading,
    isLoading,
    loadMore,
    loadReplies,
    replyTarget,
    setReplyTarget,
    setSort,
    sort,
    threads,
    total,
  } = data;
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const target = loadMoreRef.current;
    if (!target) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !isLoading) void loadMore();
      },
      { rootMargin: "300px" },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [hasMore, isLoading, loadMore, isFirstPageLoading]);

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
      onLike={() => void handleLike(comment.commentId)}
      onDelete={() => void handleDelete(comment.commentId)}
      onReplyOpen={() => handleReply(comment, options.rootId)}
      onReplyCancel={() => setReplyTarget(null)}
      onReplySubmit={handleSubmitComment}
    >
      {options.children}
    </CommentRow>
  );

  return (
    <section>
      <div className="flex items-center gap-8">
        {isFirstPageLoading ? (
          <CommentCountSkeleton />
        ) : (
          <h2 className="text-xl font-bold text-content">
            {t("mv.comments.count", { count: total.toLocaleString() })}
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
            onFocus={() => setReplyTarget(null)}
            onSubmit={async (text) => {
              const ok = await handleSubmitComment(text);
              if (ok) setSort("latest");
              return ok;
            }}
          />
        ) : (
          <p className="border-b border-content/20 pb-1 text-sm text-content-muted">
            {t("mv.comments.loginToComment")}
          </p>
        )}
      </div>

      {isFirstPageLoading ? (
        <CommentListSkeleton />
      ) : (
        <>
          <div className="mt-8 flex flex-col gap-6">
            {comments.map((comment) =>
              renderRow(comment, {
                children:
                  getReplyCount(comment) > 0 ? (
                    <CommentReplies
                      parentId={comment.commentId}
                      replyCount={getReplyCount(comment)}
                      thread={threads[comment.commentId]}
                      onLoad={loadReplies}
                      renderReply={(reply) =>
                        renderRow(reply, { compact: true, rootId: comment.commentId })
                      }
                    />
                  ) : undefined,
              }),
            )}
            {comments.length === 0 && !isLoading && (
              <p className="py-10 text-center text-sm text-content-subtle">
                {t("comments.page.noComments")}
              </p>
            )}
          </div>

          <div ref={loadMoreRef} className="flex h-16 items-center justify-center">
            {isLoading && <Loader2 className="size-6 animate-spin text-brand" />}
          </div>
        </>
      )}
    </section>
  );
}
