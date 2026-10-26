"use client";

import Link from "next/link";
import { Check, ListFilter, Loader2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { MvCommentComposer } from "./comments/MvCommentComposer";
import { MvCommentItem } from "./comments/MvCommentItem";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCommentData } from "@/hooks/comment/useCommentData";
import { getCommentHref } from "@/lib/comment/commentResource";
import { useLoginStatus } from "@/lib/hooks/useLoginStatus";
import { useUserStore } from "@/store";
import { useI18n } from "@/store/module/i18n";
import type { MvCommentsProps } from "@/types/components/mv";

type MvCommentSort = "hot" | "latest";

/**
 * MV 页视频下方的评论区（按 YouTube 复刻）：「N 条评论」与排序方式、常驻输入框、
 * 评论条目内联回复；最新评论滚动到底自动加载。数据与操作沿用评论页的 useCommentData。
 */
export function MvComments({ mvid }: MvCommentsProps) {
  const { t } = useI18n();
  const isLogin = useLoginStatus();
  const currentUserId = useUserStore((state) => state.user?.userId);
  const resource = useMemo(() => ({ kind: "mv" as const, id: String(mvid) }), [mvid]);
  const {
    comments,
    handleDelete,
    handleLike,
    handleReply,
    handleSubmitComment,
    hasMore,
    hotComments,
    isLoading,
    loadMore,
    replyTarget,
    setReplyTarget,
    total,
  } = useCommentData(resource);
  const [sort, setSort] = useState<MvCommentSort>("hot");
  const activeSort: MvCommentSort = hotComments.length > 0 ? sort : "latest";
  const list = activeSort === "hot" ? hotComments : comments;
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const target = loadMoreRef.current;
    if (!target || activeSort !== "latest") return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !isLoading) void loadMore();
      },
      { rootMargin: "300px" },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [activeSort, hasMore, isLoading, loadMore]);

  const sortOptions: { value: MvCommentSort; label: string }[] = [
    ...(hotComments.length > 0
      ? [{ value: "hot" as const, label: t("comments.page.hotComments") }]
      : []),
    { value: "latest", label: t("comments.page.latestComments") },
  ];

  return (
    <section className="mt-6">
      <div className="flex items-center gap-8">
        <h2 className="text-xl font-bold text-content">
          {t("mv.comments.count", { count: total.toLocaleString() })}
        </h2>
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
            {sortOptions.map((option) => (
              <DropdownMenuItem
                key={option.value}
                onClick={() => setSort(option.value)}
                className="flex cursor-pointer items-center justify-between"
              >
                {option.label}
                {activeSort === option.value && <Check className="size-4 text-brand" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <Link
          href={getCommentHref("mv", mvid)}
          scroll={false}
          className="ml-auto text-sm font-medium text-content-muted transition-colors hover:text-content"
        >
          {t("mv.comments.openPage")}
        </Link>
      </div>

      <div className="mt-6">
        {isLogin ? (
          <MvCommentComposer
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

      <div className="mt-8 flex flex-col gap-6">
        {list.map((comment) => (
          <MvCommentItem
            key={`${activeSort}-${comment.commentId}`}
            comment={comment}
            isOwn={String(comment.user.userId) === String(currentUserId ?? "")}
            isReplying={replyTarget?.commentId === comment.commentId}
            canReply={isLogin}
            onLike={() => void handleLike(comment.commentId, activeSort === "hot")}
            onDelete={() => void handleDelete(comment.commentId)}
            onReplyOpen={() => handleReply(comment.commentId)}
            onReplyCancel={() => setReplyTarget(null)}
            onReplySubmit={handleSubmitComment}
          />
        ))}
        {list.length === 0 && !isLoading && (
          <p className="py-10 text-center text-sm text-content-subtle">
            {t("comments.page.noComments")}
          </p>
        )}
      </div>

      {activeSort === "latest" && (
        <div ref={loadMoreRef} className="flex justify-center py-6 text-sm text-content-muted">
          {isLoading ? (
            <Loader2 className="size-6 animate-spin text-brand" />
          ) : !hasMore && comments.length > 0 ? (
            t("comments.page.end")
          ) : null}
        </div>
      )}
    </section>
  );
}
