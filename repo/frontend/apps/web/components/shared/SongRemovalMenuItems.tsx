"use client";
import { Ban, Trash } from "lucide-react";
import {
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuSeparator,
} from "@/components/ui/context-menu";
import type { SongContextMenuSectionProps } from "@/types/components/songContextMenu";

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
  return (
    <>
      {/* Queue removal */}
      {onRemoveFromQueue && (
        <>
          <ContextMenuSeparator />
          <ContextMenuGroup>
            <ContextMenuItem onClick={onRemoveFromQueue} variant="destructive">
              <Trash className="mr-2 size-4" />
              {t("contextMenu.removeFromQueue")}
            </ContextMenuItem>
          </ContextMenuGroup>
        </>
      )}

      {/* Playlist removal */}
      {isLogin && !readonly && !isDailyRecommend && onRemoveFromPlaylist && (
        <>
          <ContextMenuSeparator />
          <ContextMenuGroup>
            <ContextMenuItem onClick={onRemoveFromPlaylist} variant="destructive">
              <Trash className="mr-2 size-4" />
              {t("contextMenu.removeFromPlaylist")}
            </ContextMenuItem>
          </ContextMenuGroup>
        </>
      )}

      {/* Daily recommendation dislike */}
      {isDailyRecommend && isLogin && onDislikeDailyRecommend && (
        <>
          <ContextMenuSeparator />
          <ContextMenuGroup>
            <ContextMenuItem onClick={onDislikeDailyRecommend} variant="destructive">
              <Ban className="mr-2 size-4" />
              {t("contextMenu.recommendLess")}
            </ContextMenuItem>
          </ContextMenuGroup>
        </>
      )}

      {/* Personal FM dislike */}
      {isLogin && onDislikePersonalFm && (
        <>
          <ContextMenuSeparator />
          <ContextMenuGroup>
            <ContextMenuItem onClick={onDislikePersonalFm} variant="destructive">
              <Ban className="mr-2 size-4" />
              {t("contextMenu.recommendLess")}
            </ContextMenuItem>
          </ContextMenuGroup>
        </>
      )}
    </>
  );
}
