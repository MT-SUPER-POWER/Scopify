"use client";
import { Heart, ListMusic, ListPlus, Pause, Play } from "lucide-react";
import {
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuSeparator,
} from "@/components/ui/context-menu";
import { CreatePlaylistFromTracksDialog } from "@/components/shared/CreatePlaylistFromTracksDialog";
import { SongNavigationMenuItems } from "@/components/shared/SongNavigationMenuItems";
import { SongPlaylistMenuItems } from "@/components/shared/SongPlaylistMenuItems";
import { SongRemovalMenuItems } from "@/components/shared/SongRemovalMenuItems";
import { useSongContextMenuActions } from "@/hooks/song/useSongContextMenuActions";
import type { SongContextMenuActionsProps } from "@/types/components/songContextMenu";

export function SongContextMenuActions(actions: SongContextMenuActionsProps) {
  const model = useSongContextMenuActions(actions);
  const {
    t,
    isMulti,
    targetSongs,
    isLogin,
    isLiked,
    allTargetLiked,
    handlePlay,
    handleLike,
    handleAddToQueue,
  } = model;
  const {
    isContextMenuOpen,
    isCreateDialogOpen,
    setIsCreateDialogOpen,
    isActive,
    isPlaying,
    onRemoveFromQueue,
    onSimilarSongs,
    song,
  } = actions;
  return (
    <>
      {isContextMenuOpen && (
        <ContextMenuContent className="z-9999 w-56">
          <ContextMenuGroup>
            <ContextMenuItem onSelect={handlePlay}>
              {isActive && isPlaying && !isMulti ? (
                <Pause className="mr-2 size-4" />
              ) : (
                <Play className="mr-2 size-4" />
              )}
              {isMulti
                ? `播放所选 (${targetSongs.length} 首)`
                : t(isActive && isPlaying ? "contextMenu.pause" : "contextMenu.play")}
            </ContextMenuItem>
            {!onRemoveFromQueue && (
              <ContextMenuItem onSelect={handleAddToQueue}>
                <ListPlus className="mr-2 size-4" />
                {isMulti
                  ? `添加所选 (${targetSongs.length} 首) 到队列`
                  : t("contextMenu.addToQueue")}
              </ContextMenuItem>
            )}
            {!isMulti && song.voiceId === undefined && onSimilarSongs && (
              <ContextMenuItem onSelect={() => requestAnimationFrame(onSimilarSongs)}>
                <ListMusic className="mr-2 size-4" />
                {t("song.similar.action")}
              </ContextMenuItem>
            )}
            {isLogin && (
              <ContextMenuItem onClick={handleLike}>
                <Heart className="mr-2 size-4" />
                {isMulti
                  ? `${allTargetLiked ? "取消喜欢" : "喜欢"} (${targetSongs.length} 首)`
                  : t(isLiked ? "contextMenu.removeFromLiked" : "contextMenu.addToLiked")}
              </ContextMenuItem>
            )}
          </ContextMenuGroup>
          {(isLogin || !isMulti) && <ContextMenuSeparator />}
          <ContextMenuGroup>
            {isLogin && <SongPlaylistMenuItems actions={actions} model={model} />}
            {!isMulti && <SongNavigationMenuItems actions={actions} model={model} />}
          </ContextMenuGroup>
          {!isMulti && <SongRemovalMenuItems actions={actions} model={model} />}
        </ContextMenuContent>
      )}
      {isCreateDialogOpen && (
        <CreatePlaylistFromTracksDialog
          open
          onOpenChange={setIsCreateDialogOpen}
          tracks={targetSongs}
        />
      )}
    </>
  );
}
