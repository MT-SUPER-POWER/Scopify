"use client";

import { CloudOff, Download, Link2, Link2Off, ListPlus, Pause, Play } from "lucide-react";
import { useState } from "react";
import { CreatePlaylistFromTracksDialog } from "@/components/shared/CreatePlaylistFromTracksDialog";
import { SongPlaylistMenuItems } from "@/components/shared/SongPlaylistMenuItems";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { useSongContextMenuActions } from "@/hooks/song/useSongContextMenuActions";
import { isCloudSongMatched } from "@/types/library/cloudApi";
import type { CloudSongContextMenuProps } from "@/types/library/components";
import type { SongContextMenuActionsProps } from "@/types/song/contextMenuComponents";

/** 云盘文件专用菜单：只保留对上传文件有意义的操作，并接入云盘自己的接口。 */
export function CloudSongContextMenu({
  children,
  cloudActions,
  onOpenContextMenu,
  ...props
}: CloudSongContextMenuProps) {
  const [isContextMenuOpen, setIsContextMenuOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  return (
    <ContextMenu
      onOpenChange={(open) => {
        setIsContextMenuOpen(open);
        if (open) onOpenContextMenu?.();
      }}
    >
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      {(isContextMenuOpen || isCreateDialogOpen) && (
        <CloudSongContextMenuContent
          {...props}
          cloudActions={cloudActions}
          isContextMenuOpen={isContextMenuOpen}
          isCreateDialogOpen={isCreateDialogOpen}
          setIsCreateDialogOpen={setIsCreateDialogOpen}
        />
      )}
    </ContextMenu>
  );
}

function CloudSongContextMenuContent({
  cloudActions,
  ...actions
}: SongContextMenuActionsProps & Pick<CloudSongContextMenuProps, "cloudActions">) {
  const model = useSongContextMenuActions(actions);
  const { t, isMulti, targetSongs, isLogin, handlePlay, handleAddToQueue } = model;
  const { isActive, isPlaying, song, isContextMenuOpen, isCreateDialogOpen } = actions;
  const isMatched = isCloudSongMatched(song);

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
            <ContextMenuItem onSelect={handleAddToQueue}>
              <ListPlus className="mr-2 size-4" />
              {isMulti ? `添加所选 (${targetSongs.length} 首) 到队列` : t("contextMenu.addToQueue")}
            </ContextMenuItem>
          </ContextMenuGroup>
          {isLogin && (
            <>
              <ContextMenuSeparator />
              <ContextMenuGroup>
                <SongPlaylistMenuItems actions={actions} model={model} />
              </ContextMenuGroup>
            </>
          )}
          {isLogin && !isMulti && (
            <>
              <ContextMenuSeparator />
              <ContextMenuGroup>
                <ContextMenuItem onSelect={() => cloudActions.onMatch(song)}>
                  <Link2 className="mr-2 size-4" />
                  {t(isMatched ? "library.cloud.rematch" : "library.cloud.match")}
                </ContextMenuItem>
                {isMatched && (
                  <ContextMenuItem onSelect={() => cloudActions.onUnmatch(song)}>
                    <Link2Off className="mr-2 size-4" />
                    {t("library.cloud.unmatch")}
                  </ContextMenuItem>
                )}
                <ContextMenuItem onSelect={() => cloudActions.onDownload(song)}>
                  <Download className="mr-2 size-4" />
                  {t("library.cloud.download")}
                </ContextMenuItem>
              </ContextMenuGroup>
              <ContextMenuSeparator />
              <ContextMenuGroup>
                <ContextMenuItem onSelect={() => cloudActions.onRemove(song)} variant="destructive">
                  <CloudOff className="mr-2 size-4" />
                  {t("library.cloud.remove")}
                </ContextMenuItem>
              </ContextMenuGroup>
            </>
          )}
        </ContextMenuContent>
      )}
      {isCreateDialogOpen && (
        <CreatePlaylistFromTracksDialog
          open
          onOpenChange={actions.setIsCreateDialogOpen}
          tracks={targetSongs}
        />
      )}
    </>
  );
}
