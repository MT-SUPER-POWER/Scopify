"use client";
import { FolderPlus, PlusCircle } from "lucide-react";
import {
  ContextMenuItem,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
} from "@/components/ui/context-menu";
import type { SongContextMenuSectionProps } from "@/types/components/songContextMenu";

export function SongPlaylistMenuItems({ actions, model }: SongContextMenuSectionProps) {
  const { t, isMulti, targetSongs, filteredPlaylists, handleAddToPlaylist, isPlaylistPending } =
    model;
  return (
    <>
      <ContextMenuItem onSelect={() => actions.setIsCreateDialogOpen(true)}>
        <FolderPlus className="mr-2 size-4" />
        {isMulti ? `新建歌单并收纳 (${targetSongs.length} 首)` : t("sidebar.menu.createPlaylist")}
      </ContextMenuItem>
      <ContextMenuSub>
        <ContextMenuSubTrigger>
          <PlusCircle className="mr-4 size-4" />
          {isMulti ? `添加所选 (${targetSongs.length} 首) 到歌单` : t("contextMenu.addToPlaylist")}
        </ContextMenuSubTrigger>
        <ContextMenuSubContent className="z-9999 max-h-72 max-w-80 overflow-y-auto">
          {filteredPlaylists.length === 0 && (
            <ContextMenuItem disabled>{t("song.similar.noPlaylists")}</ContextMenuItem>
          )}
          {filteredPlaylists.map((playlist) => (
            <ContextMenuItem
              key={playlist.id}
              disabled={isPlaylistPending}
              onSelect={() => void handleAddToPlaylist(playlist)}
            >
              {playlist.coverImgUrl && (
                <img
                  width={28}
                  height={28}
                  src={playlist.coverImgUrl}
                  alt=""
                  className="mr-2 size-7 rounded-sm object-cover"
                />
              )}
              <span className="truncate">{playlist.name}</span>
            </ContextMenuItem>
          ))}
        </ContextMenuSubContent>
      </ContextMenuSub>
    </>
  );
}
