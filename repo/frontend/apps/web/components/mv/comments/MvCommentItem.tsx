"use client";

import Image from "next/image";
import Link from "next/link";
import { EllipsisVertical, Flag, ThumbsUp, Trash2 } from "lucide-react";
import { MvCommentComposer } from "./MvCommentComposer";
import { renderEmojiContent } from "@/components/Comment/renderEmojiContent";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { resolveCommentIpLocation } from "@/lib/comment/commentResource";
import { getSizedImageUrl } from "@/lib/music/imageUrl";
import { cn, formatPlayCount } from "@/lib/utils";
import { useI18n } from "@/store/module/i18n";
import type { MvCommentItemProps } from "@/types/mv/components";

/**
 * YouTube 式评论条目：头像、「@昵称 · 时间」、正文，下方点赞与「回复」；
 * 被回复的原评论以引用形式显示在正文前；点「回复」在条目下方展开紧凑输入框。
 */
export function MvCommentItem({
  comment,
  isOwn,
  isReplying,
  canReply,
  onLike,
  onDelete,
  onReplyOpen,
  onReplyCancel,
  onReplySubmit,
}: MvCommentItemProps) {
  const { t } = useI18n();
  const profileHref = `/profile?userId=${comment.user.userId}`;
  const ipLocation = resolveCommentIpLocation(comment);
  const repliedTo = comment.beReplied?.[0];

  return (
    <div className="group/comment flex gap-4">
      <Link href={profileHref} scroll={false} className="h-fit shrink-0">
        <span className="relative block size-10 overflow-hidden rounded-full bg-surface-elevated">
          {comment.user.avatarUrl && (
            <Image
              fill
              sizes="40px"
              src={getSizedImageUrl(comment.user.avatarUrl, 120)}
              alt={comment.user.nickname}
              className="object-cover"
            />
          )}
        </span>
      </Link>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-1.5 text-xs">
          <Link
            href={profileHref}
            scroll={false}
            className="truncate text-[13px] font-medium text-content hover:underline"
          >
            @{comment.user.nickname}
          </Link>
          <span className="shrink-0 text-content-muted">{comment.timeStr}</span>
          {ipLocation && <span className="shrink-0 text-content-subtle">· {ipLocation}</span>}
        </div>

        {repliedTo && (
          <p className="mt-1 line-clamp-2 border-l-2 border-content/20 pl-2 text-xs text-content-muted">
            <span className="font-medium text-content/80">@{repliedTo.user?.nickname}</span>{" "}
            {!repliedTo.content || repliedTo.content.includes("该评论已删除")
              ? t("comments.item.deletedComment")
              : repliedTo.content}
          </p>
        )}

        <p className="mt-1 text-sm leading-5 break-words whitespace-pre-wrap text-content select-text">
          {renderEmojiContent(comment.content)}
        </p>

        <div className="mt-1 -ml-2 flex items-center">
          <button
            type="button"
            onClick={onLike}
            aria-pressed={comment.liked}
            aria-label={t(comment.liked ? "common.action.unlike" : "common.action.like")}
            className="flex h-8 items-center gap-1 rounded-full px-2 text-content transition-colors hover:bg-content/10"
          >
            <ThumbsUp className={cn("size-4", comment.liked && "fill-current text-brand")} />
            {comment.likedCount > 0 && (
              <span className="text-xs text-content-muted tabular-nums">
                {formatPlayCount(comment.likedCount)}
              </span>
            )}
          </button>
          {canReply && (
            <button
              type="button"
              onClick={onReplyOpen}
              className="ml-1 h-8 rounded-full px-3 text-xs font-medium text-content transition-colors hover:bg-content/10"
            >
              {t("common.action.reply")}
            </button>
          )}
        </div>

        {isReplying && (
          <div className="mt-2">
            <MvCommentComposer
              compact
              autoFocus
              placeholder={t("comments.input.replyTo", { name: comment.user.nickname })}
              submitLabel={t("common.action.reply")}
              onSubmit={onReplySubmit}
              onCancel={onReplyCancel}
            />
          </div>
        )}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label={t("mv.card.more")}
            className="-mt-1 flex size-9 shrink-0 items-center justify-center rounded-full text-content opacity-0 transition-opacity group-hover/comment:opacity-100 hover:bg-content/10 focus-visible:opacity-100 data-[state=open]:opacity-100"
          >
            <EllipsisVertical className="size-5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-32">
          {isOwn ? (
            <DropdownMenuItem onClick={onDelete} className="cursor-pointer text-destructive">
              <Trash2 className="mr-2 size-4 text-destructive" />
              {t("comments.item.delete")}
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem className="cursor-pointer">
              <Flag className="mr-2 size-4" />
              {t("comments.item.report")}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
