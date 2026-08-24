"use client";

import { Badge } from "@scopify/ui/shadcn/components/badge";
import { ArrowDownCircle, MessageCircle, MoreHorizontal, Pause, Play, Shuffle } from "lucide-react";

import { CollectionToggleButton } from "@/components/shared/CollectionToggleButton";
import { useCommentCountQuery } from "@/hooks/comment/useCommentCountQuery";
import { getCommentHref } from "@/lib/comment/commentResource";
import { useSmartRouter } from "@/lib/hooks/useSmartRouter";
import { formatCompactCount } from "@/lib/utils";
import { useI18n } from "@/store/module/i18n";
import type { AlbumActionsProps } from "@/types/album";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@scopify/ui/shadcn/components/tooltip";

export function AlbumActions({
  albumId,
  isPlaying,
  isAlbumCollected,
  isTogglingAlbumSubscribe,
  onPlay,
  onToggleSubscribe,
}: AlbumActionsProps) {
  const { t } = useI18n();
  const smartRouter = useSmartRouter();
  const { data: commentCount } = useCommentCountQuery("album", albumId);
  const playLabel = t(isPlaying ? "ui.pause" : "ui.play");
  const commentLabel =
    commentCount === undefined
      ? t("album.action.comments")
      : t("album.action.commentsWithCount", { count: formatCompactCount(commentCount) });

  return (
    <TooltipProvider>
      <div className="flex items-center gap-6 p-6">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label={playLabel}
              onClick={onPlay}
              className="flex size-14 items-center justify-center rounded-full bg-brand text-brand-foreground shadow-brand transition-all hover:scale-105 hover:bg-brand-hover focus-visible:ring-2 focus-visible:ring-brand/60 focus-visible:outline-none"
            >
              {isPlaying ? (
                <Pause className="ml-0.5 size-6 fill-current" />
              ) : (
                <Play className="ml-1.5 size-6 fill-current" />
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" sideOffset={8}>
            {playLabel}
          </TooltipContent>
        </Tooltip>

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

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label={t("album.action.shuffle")}
              className="flex size-8 items-center justify-center text-content-muted transition-colors hover:text-content focus-visible:ring-2 focus-visible:ring-brand/60 focus-visible:outline-none"
            >
              <Shuffle className="size-8" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" sideOffset={8}>
            {t("album.action.shuffle")}
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label={t("album.action.download")}
              className="flex size-8 items-center justify-center text-content-muted transition-colors hover:text-content focus-visible:ring-2 focus-visible:ring-brand/60 focus-visible:outline-none"
            >
              <ArrowDownCircle className="size-8" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" sideOffset={8}>
            {t("album.action.download")}
          </TooltipContent>
        </Tooltip>

        <CollectionToggleButton
          isCollected={isAlbumCollected}
          isLoading={isTogglingAlbumSubscribe}
          onToggle={onToggleSubscribe}
          subscribeLabel={t("album.action.subscribe")}
          unsubscribeLabel={t("album.action.unsubscribe")}
        />

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label={t("album.action.more")}
              className="flex size-8 items-center justify-center text-content-muted transition-colors hover:text-content focus-visible:ring-2 focus-visible:ring-brand/60 focus-visible:outline-none"
            >
              <MoreHorizontal className="size-8" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" sideOffset={8}>
            {t("album.action.more")}
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
