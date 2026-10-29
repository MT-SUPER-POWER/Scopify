"use client";

import Image from "next/image";
import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Skeleton } from "@scopify/ui/shadcn/components/skeleton";
import { useCommentReplies } from "@/hooks/comment/useCommentReplies";
import { getSizedImageUrl } from "@/lib/music/imageUrl";
import { cn } from "@/lib/utils";
import { useI18n } from "@/store/module/i18n";
import type { CommentRepliesProps } from "@/types/comment/components";

/**
 * 评论下的「N 条回复」：头像 + 回复数 + 展开箭头，点开后列出回复，不够再「显示更多回复」。
 * 作为 CommentRow 网格的后续行使用（返回两个右列单元格）。条目进入视口时就取首页回复，
 * 既能在收起状态下露出第一位回复者的头像，展开时也不用再等。
 * 回复取不到时只在这一层楼里显示重试，不影响整个评论区。
 */
export function CommentReplies({
  resource,
  parentId,
  replyCount,
  renderReply,
}: CommentRepliesProps) {
  const { t } = useI18n();
  const [expanded, setExpanded] = useState(false);
  const [isNear, setIsNear] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const thread = useCommentReplies(resource, parentId, isNear || expanded);

  useEffect(() => {
    const node = toggleRef.current;
    if (!node || isNear) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsNear(true);
      },
      { rootMargin: "200px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [isNear]);

  const firstAvatar = thread.replies[0]?.user.avatarUrl;
  const retryClass =
    "-ml-2 h-9 w-fit rounded-full px-3 text-sm font-medium text-brand transition-colors hover:bg-brand/10 disabled:opacity-50";

  return (
    <>
      <button
        ref={toggleRef}
        type="button"
        aria-expanded={expanded}
        onClick={() => setExpanded((value) => !value)}
        className="col-start-2 -ml-2 flex h-9 w-fit items-center gap-2 rounded-full px-2 text-sm font-medium text-brand transition-colors hover:bg-brand/10"
      >
        <span className="relative size-6 shrink-0 overflow-hidden rounded-full bg-surface-elevated">
          {firstAvatar && (
            <Image
              fill
              sizes="24px"
              src={getSizedImageUrl(firstAvatar, 120)}
              alt=""
              className="object-cover"
            />
          )}
        </span>
        <span>{t("comments.replies.count", { count: replyCount.toLocaleString() })}</span>
        <ChevronDown className={cn("size-4 transition-transform", expanded && "rotate-180")} />
      </button>

      {expanded && (
        <div className="col-start-2 flex flex-col gap-4 pt-1 pb-2">
          {thread.replies.map((reply) => renderReply(reply))}
          {!thread.hasResult &&
            !thread.isError &&
            Array.from({ length: Math.min(replyCount, 3) }, (_, index) => (
              <div key={index} className="flex gap-3">
                <Skeleton className="size-6 shrink-0 rounded-full bg-skeleton" />
                <div className="min-w-0 flex-1 text-sm leading-5">
                  <Skeleton className="inline-block h-[0.8em] w-2/3 bg-skeleton align-middle" />
                </div>
              </div>
            ))}
          {thread.isError && (
            <div className="flex items-center gap-2 text-sm text-content-muted">
              {t("comments.replies.loadFailed")}
              <button type="button" onClick={thread.retry} className={retryClass}>
                {t("common.action.retry")}
              </button>
            </div>
          )}
          {thread.hasMore && (
            <button
              type="button"
              disabled={thread.isLoadingMore}
              onClick={thread.loadMore}
              className={retryClass}
            >
              {thread.isLoadMoreError ? t("common.action.retry") : t("comments.replies.more")}
            </button>
          )}
        </div>
      )}
    </>
  );
}
