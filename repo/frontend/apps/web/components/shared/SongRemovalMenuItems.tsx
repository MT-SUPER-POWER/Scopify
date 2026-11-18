"use client";
import { Ban, Trash } from "lucide-react";
import {
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuSeparator,
} from "@/components/ui/context-menu";
import type { SongContextMenuSectionProps } from "@/types/song/contextMenuComponents";

export function SongRemovalMenuItems({ actions, model }: SongContextMenuSectionProps) {
  const {
    onRemoveFromQueue,
    readonly,
    isDailyRecommend,
    onRemoveFromPlaylist,
    onDislikeDailyRecommend,
    onDislikePersonalFm,
  } = actions;
  const { t, isLogin } = model;
  const removeFromPlaylist =
    isLogin && !readonly && !isDailyRecommend ? onRemoveFromPlaylist : undefined;
  const dislikeDailyRecommend = isLogin && isDailyRecommend ? onDislikeDailyRecommend : undefined;
  const dislikePersonalFm = isLogin ? onDislikePersonalFm : undefined;

  if (!onRemoveFromQueue && !removeFromPlaylist && !dislikeDailyRecommend && !dislikePersonalFm) {
    return null;
  }

  return (
    <>
      <ContextMenuSeparator />
      <ContextMenuGroup>
        {onRemoveFromQueue && (
          <ContextMenuItem onClick={onRemoveFromQueue} variant="destructive">
            <Trash className="mr-2 size-4" />
            {t("contextMenu.removeFromQueue")}
          </ContextMenuItem>
        )}
        {removeFromPlaylist && (
          <ContextMenuItem onClick={removeFromPlaylist} variant="destructive">
            <Trash className="mr-2 size-4" />
            {t("contextMenu.removeFromPlaylist")}
          </ContextMenuItem>
        )}
        {dislikeDailyRecommend && (
          <ContextMenuItem onClick={dislikeDailyRecommend} variant="destructive">
            <Ban className="mr-2 size-4" />
            {t("contextMenu.recommendLess")}
          </ContextMenuItem>
        )}
        {dislikePersonalFm && (
          <ContextMenuItem onClick={dislikePersonalFm} variant="destructive">
            <Ban className="mr-2 size-4" />
            {t("contextMenu.recommendLess")}
          </ContextMenuItem>
        )}
      </ContextMenuGroup>
    </>
  );
}
