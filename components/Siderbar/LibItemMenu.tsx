/*
 * ---------------------------------------
 *  right click 歌单出现的页面
 * ---------------------------------------
 */

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ PACKAGE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


import { IoAddCircleOutline } from "react-icons/io5";
import { Play, Heart, Trash } from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import React from "react";
import { LibItemMenuProps } from "@/types/components/Siderbar";


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ UI ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// TODO: 制作适配的右键栏目
function LibItemContextMenu({ children }: LibItemMenuProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        <ContextMenuGroup>
          <ContextMenuItem>
            <Play className="w-4 h-4 mr-2" />
            Play
          </ContextMenuItem>
          <ContextMenuItem>
            <Heart className="w-4 h-4 mr-2" />
            Add to Liked Songs
          </ContextMenuItem>
        </ContextMenuGroup>
        <ContextMenuSeparator />
        <ContextMenuGroup>
          <ContextMenuSub>
            <ContextMenuSubTrigger>
              <IoAddCircleOutline className="w-4 h-4 mr-2" />
              Add to Playlist
            </ContextMenuSubTrigger>
            <ContextMenuSubContent className="w-40">
              <ContextMenuItem>Create New Playlist</ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem>My Playlist 1</ContextMenuItem>
              <ContextMenuItem>My Playlist 2</ContextMenuItem>
            </ContextMenuSubContent>
          </ContextMenuSub>
        </ContextMenuGroup>
        <ContextMenuSeparator />
        <ContextMenuGroup>
          <ContextMenuItem variant="destructive">
            <Trash className="w-4 h-4 mr-2" />
            Remove from Playlist
          </ContextMenuItem>
        </ContextMenuGroup>
      </ContextMenuContent>
    </ContextMenu>
  );
}

export default React.memo(LibItemContextMenu);
