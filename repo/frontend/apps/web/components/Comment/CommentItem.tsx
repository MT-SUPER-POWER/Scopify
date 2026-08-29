import { Flag, MoreHorizontal, Trash2 } from "lucide-react";
import Image from "next/image";
import type React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LikeButton } from "@/components/ui/LikeButton";
import { resolveCommentIpLocation } from "@/lib/comment/commentResource";
import { useI18n } from "@/store/module/i18n";
import type { CommentItemProps } from "@/types/components/comment";
import { renderEmojiContent } from "./renderEmojiContent";

function ReplyArrowIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M13.5 4.5L20 10l-6.5 5.5V12C7.5 12 4.5 15 3 19.5c1.2-6 5-10 10.5-10.5V4.5z" />
    </svg>
  );
}

export const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  isHot = false,
  currentUserId,
  onLike,
  onDelete,
  onReply,
  onReport,
  onRouterClick,
}) => {
  const { t } = useI18n();
  const isOwnComment = String(comment.user.userId) === String(currentUserId ?? "");
  const ipLocation = resolveCommentIpLocation(comment);

  return (
    <div className="group flex gap-4">
      <Image
        width={40}
        height={40}
        src={comment.user.avatarUrl}
        alt={comment.user.nickname}
        className="mt-1 size-10 shrink-0 cursor-pointer rounded-full bg-surface-elevated object-cover"
      />
      <div className="flex-1 border-b border-content/5 pb-6 group-last:border-0">
        <div className="mb-1 flex items-baseline gap-2">
          <button
            type="button"
            onClick={() => onRouterClick?.(`/profile?userId=${comment.user.userId}`)}
          >
            <span className="cursor-pointer text-sm font-bold select-text hover:underline">
              {comment.user.nickname}
            </span>
          </button>
        </div>

        <p className="cursor-text text-sm leading-relaxed whitespace-pre-wrap text-content/90 select-text">
          {renderEmojiContent(comment.content)}
        </p>

        {comment.beReplied && comment.beReplied.length > 0 && (
          <div className="mt-4 flex flex-col gap-1.5 rounded-r-lg border-l-[3px] border-brand bg-surface-elevated px-4 py-3">
            <span className="text-sm font-bold text-brand select-text">
              @{comment.beReplied[0].user?.nickname || t("common.meta.unknownUser")}
            </span>
            {!comment.beReplied[0].content ||
            comment.beReplied[0].content.includes("该评论已删除") ? (
              <span className="text-sm text-content/40 select-text">
                {t("comments.item.deletedComment")}
              </span>
            ) : (
              <span className="line-clamp-3 cursor-text text-sm text-content-muted select-text">
                {comment.beReplied[0].content}
              </span>
            )}
          </div>
        )}

        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center text-xs text-content-muted">
            <span>{comment.timeStr}</span>
            {ipLocation && (
              <>
                <span className="mx-1.5">·</span>
                <span>{t("comments.item.ipLocation", { location: ipLocation })}</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-5 text-content-muted">
            <button
              type="button"
              onClick={() => onReply?.(comment.commentId)}
              title={t("common.action.reply")}
              className="cursor-pointer rounded transition-colors outline-none hover:text-content focus-visible:ring-2 focus-visible:ring-brand"
            >
              <ReplyArrowIcon className="size-4" />
            </button>

            <LikeButton
              liked={comment.liked}
              likedCount={comment.likedCount}
              onLike={() => onLike?.(comment.commentId, isHot)}
            />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="rounded transition-colors outline-none hover:text-content focus-visible:ring-2 focus-visible:ring-brand"
                >
                  <MoreHorizontal className="size-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-32">
                {isOwnComment ? (
                  <DropdownMenuItem
                    onClick={() => onDelete?.(comment.commentId)}
                    className="cursor-pointer text-destructive"
                  >
                    <Trash2 className="mr-2 size-4 text-destructive" />
                    {t("comments.item.delete")}
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem
                    onClick={() => onReport?.(comment.commentId)}
                    className="cursor-pointer"
                  >
                    <Flag className="mr-2 size-4" />
                    {t("comments.item.report")}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  );
};
