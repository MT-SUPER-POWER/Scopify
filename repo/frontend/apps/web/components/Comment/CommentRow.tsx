"use client";

import Image from "next/image";
import Link from "next/link";
import { EllipsisVertical, Flag, ThumbsUp, Trash2 } from "lucide-react";
import { CommentComposer } from "@/components/Comment/CommentComposer";
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
import type { CommentRowProps } from "@/types/comment/components";

/**
 * YouTube 式评论条目：头像、「@昵称 时间」、正文，下方点赞与「回复」。
 * 外层是两列网格：左列头像（有回复时延伸出引导线），右列正文；children 作为后续行
 * 放在右列，用来挂「N 条回复」和展开的回复。
 */
export function CommentRow({
  comment,
  isOwn,
  isReplying,
  canReply,
  compact = false,
  rootId,
  hasReplies = false,
  onLike,
  onDelete,
  onReplyOpen,
  onReplyCancel,
  onReplySubmit,
  children,
}: CommentRowProps) {
  const { t } = useI18n();
  const profileHref = `/profile?userId=${comment.user.userId}`;
  const ipLocation = resolveCommentIpLocation(comment);
  const repliedTo = comment.beReplied?.[0];
  // 楼中楼里默认都是回复楼主，只有回复别的回复时才在正文前提一下对象
  const mention =
    compact && repliedTo?.beRepliedCommentId && repliedTo.beRepliedCommentId !== rootId
      ? repliedTo.user?.nickname
      : undefined;
  const showQuote = !compact && repliedTo;

  return (
    <div
      className={cn(
        "group/comment grid grid-cols-[auto_minmax(0,1fr)]",
        compact ? "gap-x-3" : "gap-x-4",
      )}
    >
      <div className="row-span-2 flex flex-col items-center">
        <Link href={profileHref} scroll={false} className="h-fit shrink-0">
          <span
            className={cn(
              "relative block overflow-hidden rounded-full bg-surface-elevated",
              compact ? "size-6" : "size-10",
            )}
          >
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
        {hasReplies && (
          <div className="relative mt-2 w-full flex-1">
            {/* 从头像下方垂直下来，在「N 条回复」行的中线拐弯指向它（该行高 36px） */}
            <span className="absolute top-0 -right-3 bottom-[18px] left-1/2 rounded-bl-xl border-b border-l border-content/20" />
          </div>
        )}
      </div>

      <div className={cn("col-start-2 flex min-w-0", compact ? "gap-3" : "gap-4")}>
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

          {showQuote && (
            <p className="mt-1 line-clamp-2 border-l-2 border-content/20 pl-2 text-xs text-content-muted">
              <span className="font-medium text-content/80">@{repliedTo.user?.nickname}</span>{" "}
              {!repliedTo.content || repliedTo.content.includes("该评论已删除")
                ? t("comments.item.deletedComment")
                : repliedTo.content}
            </p>
          )}

          <p className="mt-1 text-sm leading-5 break-words whitespace-pre-wrap text-content select-text">
            {mention && <span className="mr-1 text-brand">@{mention}</span>}
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
              <CommentComposer
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

      {children}
    </div>
  );
}
