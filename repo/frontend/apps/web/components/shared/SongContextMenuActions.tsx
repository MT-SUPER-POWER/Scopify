"use client";
import { Heart, HeartOff, ListMusic, ListPlus, NotebookPen, Pause, Play } from "lucide-react";
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
import { useActiveProvider } from "@/hooks/provider/useActiveProvider";
import { useSongContextMenuActions } from "@/hooks/song/useSongContextMenuActions";
import type { SongContextMenuActionsProps } from "@/types/song/contextMenuComponents";

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
    handleAddToScratchpad,
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
  const { capabilities } = useActiveProvider();
  const canLike = isLogin && capabilities.has("track.like");
  const canManagePlaylists = isLogin && capabilities.has("playlist.manage");
  const removeFromLiked = isMulti ? allTargetLiked : isLiked;
  const LikeIcon = removeFromLiked ? HeartOff : Heart;
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
            <ContextMenuItem onSelect={handleAddToScratchpad}>
              <NotebookPen className="mr-2 size-4" />
              {isMulti
                ? t("contextMenu.addSelectedToScratchpad", { count: targetSongs.length })
                : t("contextMenu.addToScratchpad")}
            </ContextMenuItem>
            {!isMulti && song.voiceId === undefined && onSimilarSongs && (
              <ContextMenuItem onSelect={() => requestAnimationFrame(onSimilarSongs)}>
                <ListMusic className="mr-2 size-4" />
                {t("song.similar.action")}
              </ContextMenuItem>
            )}
            {canLike && (
              <ContextMenuItem onClick={handleLike}>
                <LikeIcon className="mr-2 size-4" />
                {isMulti
                  ? `${removeFromLiked ? "取消喜欢" : "喜欢"} (${targetSongs.length} 首)`
                  : t(removeFromLiked ? "contextMenu.removeFromLiked" : "contextMenu.addToLiked")}
              </ContextMenuItem>
            )}
          </ContextMenuGroup>
          {(canManagePlaylists || !isMulti) && <ContextMenuSeparator />}
          <ContextMenuGroup>
            {canManagePlaylists && <SongPlaylistMenuItems actions={actions} model={model} />}
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
