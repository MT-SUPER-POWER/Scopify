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
import { useI18n } from "@/store/module/i18n";
import type { NeteaseComment } from "@/types/api/music";
import { renderEmojiContent } from "./renderEmojiContent";

interface CommentItemProps {
  comment: NeteaseComment;
  isHot?: boolean;
  onLike?: (id: number, isHot: boolean) => void;
  // 预留删除接口，父组件传入处理函数即可
  onDelete?: (id: number) => void;
  onReply?: (id: number) => void;
  onReport?: (id: number) => void;
  onRouterClick?: (url: string) => void;
}

export const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  isHot = false,
  onLike,
  onDelete,
  onReply,
  onReport,
  onRouterClick,
}) => {
  const { t } = useI18n();

  return (
    <div className="flex gap-4 group">
    <Image
      width={40}
      height={40}
      src={comment.user.avatarUrl}
      alt={comment.user.nickname}
      className="w-10 h-10 rounded-full bg-neutral-800 object-cover mt-1 shrink-0 cursor-pointer"
    />
    <div className="flex-1 pb-6 border-b border-white/5 group-last:border-0">
      <div className="flex items-baseline gap-2 mb-1">
        {/* 加入 select-text 允许选中用户名 */}
        <button onClick={() => onRouterClick?.(`/profile?userId=${comment.user.userId}`)}>
          <span className="font-bold text-sm hover:underline cursor-pointer select-text">
            {comment.user.nickname}
          </span>
          <span className="text-xs text-[#B3B3B3]">{comment.timeStr}</span>
        </button>
      </div>

      {/* 加入 select-text 和 cursor-text 允许鼠标正常选中和复制评论内容 */}
      <p className="text-sm text-white/90 leading-relaxed whitespace-pre-wrap select-text cursor-text">
        {renderEmojiContent(comment.content)}
      </p>

      {/* 回复引用区块 */}
      {comment.beReplied && comment.beReplied.length > 0 && (
        <div className="mt-4 flex flex-col gap-1.5 border-l-[3px] border-[#1DB954] bg-[#1a1a1a] px-4 py-3 rounded-r-lg">
          <span className="text-sm font-bold text-[#1DB954] select-text">
            @{comment.beReplied[0].user?.nickname || t("common.meta.unknownUser")}
          </span>

          {!comment.beReplied[0].content ||
          comment.beReplied[0].content.includes("该评论已删除") ? (
            <span className="text-sm text-white/40 select-text">
              {t("comments.item.deletedComment")}
            </span>
          ) : (
            <span className="text-sm text-[#B3B3B3] line-clamp-3 select-text cursor-text">
              {comment.beReplied[0].content}
            </span>
          )}
        </div>
      )}

      {/* 操作栏 */}
      <div className="flex items-center justify-between mt-3">
        <div className="flex gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onReply?.(comment.commentId)}
            className="text-xs font-semibold text-[#B3B3B3] hover:text-white transition-colors"
          >
            {t("common.action.reply")}
          </button>
        </div>

        <div className="flex items-center gap-6 text-[#B3B3B3]">
          <LikeButton
            liked={comment.liked}
            likedCount={comment.likedCount}
            onLike={() => onLike?.(comment.commentId, isHot)}
          />

          {/* shadcn DropdownMenu 多选组件 */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="hover:text-white transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#1DB954] rounded">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-32 bg-[#282828] border-white/10 text-white"
            >
              {/* 举报 */}
              <DropdownMenuItem
                onClick={() => onReport?.(comment.commentId)}
                className="bg-[#282828] hover:bg-black-500/80 cursor-pointer"
              >
                <Flag className="w-4 h-4 mr-2" />
                {t("comments.item.report")}
              </DropdownMenuItem>

              {/* 删除评论 */}
              <DropdownMenuItem
                onClick={() => onDelete?.(comment.commentId)}
                className="text-red-500 focus:text-red-500 focus:bg-red-500/10 cursor-pointer"
              >
                <Trash2 className="text-red-500 focus:text-red-500 w-4 h-4 mr-2" />
                {t("comments.item.delete")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
    </div>
  );
};
