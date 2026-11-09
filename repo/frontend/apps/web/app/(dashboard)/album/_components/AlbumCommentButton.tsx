"use client";

import { Badge } from "@scopify/ui/shadcn/components/badge";
import { MessageCircle } from "lucide-react";

import { useCommentCountQuery } from "@/hooks/comment/useCommentCountQuery";
import { useCommentKindSupported } from "@/hooks/comment/useCommentTarget";
import { useSmartRouter } from "@/hooks/core/useSmartRouter";
import { getCommentHref } from "@/lib/comment/commentResource";
import { formatCompactCount } from "@/lib/utils";
import { useTranslation } from "react-i18next";

import { Tooltip, TooltipContent, TooltipTrigger } from "@scopify/ui/shadcn/components/tooltip";

/** The album's comments, which are a NetEase feature; it sits inside the actions' tooltip provider. */
export function AlbumCommentButton({ albumId }: { albumId: string }) {
  const { t } = useTranslation();
  const smartRouter = useSmartRouter();
  const { data: commentCount } = useCommentCountQuery("album", albumId);
  const supported = useCommentKindSupported("album");
  const commentLabel =
    commentCount === undefined
      ? t("album.action.comments")
      : t("album.action.commentsWithCount", {
          count: commentCount,
          replace: { count: formatCompactCount(commentCount) },
        });

  if (!supported) return null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={commentLabel}
          onClick={() => smartRouter.push(getCommentHref("album", albumId))}
          className="relative inline-flex size-8 cursor-pointer items-center justify-center text-content-muted transition-colors hover:text-content focus-visible:ring-2 focus-visible:ring-brand/60 focus-visible:outline-none"
        >
          <MessageCircle className="size-8" />
          {commentCount !== undefined && (
            <Badge
              variant="outline"
              className="pointer-events-none absolute top-0 right-0 h-4 min-w-4 translate-x-1/2 -translate-y-1/3 border-border bg-surface-overlay px-1 text-[9px] leading-none text-content-muted tabular-nums shadow-panel backdrop-blur-sm"
            >
              {formatCompactCount(commentCount)}
            </Badge>
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" sideOffset={8}>
        {commentLabel}
      </TooltipContent>
    </Tooltip>
  );
}
