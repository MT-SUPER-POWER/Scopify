"use client";

import Image from "next/image";
import { ThumbsUp } from "lucide-react";
import { getSizedImageUrl } from "@/lib/music/imageUrl";
import { cn } from "@/lib/utils";
import type { CommentPreviewListProps } from "@/types/comment";

/** 只读的评论预览列表（头像、昵称、点赞数与正文），用于正在播放面板、MV 页等摘要位置。 */
export function CommentPreviewList({ comments, className }: CommentPreviewListProps) {
  return (
    <ul className={cn("flex flex-col", className)}>
      {comments.map((comment) => (
        <li key={comment.commentId} className="flex gap-3 px-4 py-2.5">
          <span className="relative size-7 shrink-0 overflow-hidden rounded-full bg-surface-elevated">
            {comment.user?.avatarUrl && (
              <Image
                fill
                sizes="28px"
                src={getSizedImageUrl(comment.user.avatarUrl, 80)}
                alt=""
                className="object-cover"
              />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-xs font-bold text-content-muted">
                {comment.user?.nickname}
              </span>
              {comment.likedCount > 0 && (
                <span className="flex shrink-0 items-center gap-1 text-xs text-content-subtle tabular-nums">
                  <ThumbsUp className="size-3" />
                  {comment.likedCount.toLocaleString()}
                </span>
              )}
            </div>
            <p className="mt-1 line-clamp-4 text-sm leading-6 break-words whitespace-pre-line text-content">
              {comment.content}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
