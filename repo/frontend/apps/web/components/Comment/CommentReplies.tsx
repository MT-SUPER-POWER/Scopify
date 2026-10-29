"use client";

import Image from "next/image";
import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Skeleton } from "@scopify/ui/shadcn/components/skeleton";
import { getSizedImageUrl } from "@/lib/music/imageUrl";
import { cn } from "@/lib/utils";
import { useI18n } from "@/store/module/i18n";
import type { CommentRepliesProps } from "@/types/comment/components";

/**
 * 评论下的「N 条回复」：头像 + 回复数 + 展开箭头，点开后列出回复，不够再「显示更多回复」。
 * 作为 CommentRow 网格的后续行使用（返回两个右列单元格）。条目进入视口时就取首页回复，
 * 既能在收起状态下露出第一位回复者的头像，展开时也不用再等。
 */
export function CommentReplies({
  parentId,
  replyCount,
  thread,
  onLoad,
  renderReply,
}: CommentRepliesProps) {
  const { t } = useI18n();
  const [expanded, setExpanded] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const settled = thread?.loaded || thread?.isLoading;

  useEffect(() => {
    const node = toggleRef.current;
    if (!node || settled) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) onLoad(parentId);
      },
      { rootMargin: "200px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [onLoad, parentId, settled]);

  const firstAvatar = thread?.comments[0]?.user.avatarUrl;

  return (
    <>
      <button
        ref={toggleRef}
        type="button"
        aria-expanded={expanded}
        onClick={() => {
          setExpanded((value) => !value);
          onLoad(parentId);
        }}
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
          {thread?.comments.map((reply) => renderReply(reply))}
          {!thread?.loaded &&
            Array.from({ length: Math.min(replyCount, 3) }, (_, index) => (
              <div key={index} className="flex gap-3">
                <Skeleton className="size-6 shrink-0 rounded-full bg-skeleton" />
                <div className="min-w-0 flex-1 text-sm leading-5">
                  <Skeleton className="inline-block h-[0.8em] w-2/3 bg-skeleton align-middle" />
                </div>
              </div>
            ))}
          {thread?.hasMore && (
            <button
              type="button"
              disabled={thread.isLoading}
              onClick={() => onLoad(parentId, true)}
              className="-ml-2 h-9 w-fit rounded-full px-3 text-sm font-medium text-brand transition-colors hover:bg-brand/10 disabled:opacity-50"
            >
              {t("comments.replies.more")}
            </button>
          )}
        </div>
      )}
    </>
  );
}
