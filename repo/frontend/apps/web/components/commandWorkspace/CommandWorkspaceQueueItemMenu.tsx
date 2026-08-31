"use client";

import { Disc, MoreHorizontal, Trash2, User } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { CommandWorkspaceQueueItemMenuProps } from "@/types/commandWorkspace";

export function CommandWorkspaceQueueItemMenu({
  index,
  onNavigateAlbum,
  onNavigateArtist,
  onRemove,
  track,
}: CommandWorkspaceQueueItemMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          onClick={(event) => event.stopPropagation()}
          className="flex size-7 items-center justify-center rounded-md text-zinc-400 opacity-0 transition-all group-focus-within:opacity-100 group-hover:opacity-100 hover:bg-white/10 hover:text-white data-[state=open]:bg-white/10 data-[state=open]:text-white data-[state=open]:opacity-100"
          title="更多选项"
          aria-label={`更多选项: ${track.name}`}
        >
          <MoreHorizontal className="size-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-36 border-zinc-800 bg-zinc-900/95 text-zinc-200 backdrop-blur-xl"
      >
        <DropdownMenuItem onClick={() => onRemove(index)} variant="destructive">
          <Trash2 className="size-4" />
          <span>从队列移除</span>
        </DropdownMenuItem>
        {track.al?.id ? (
          <DropdownMenuItem onClick={() => onNavigateAlbum(track.al.id)}>
            <Disc className="size-4" />
            <span>查看专辑</span>
          </DropdownMenuItem>
        ) : null}
        {track.ar?.[0]?.id ? (
          <DropdownMenuItem onClick={() => onNavigateArtist(track.ar[0].id)}>
            <User className="size-4" />
            <span>查看歌手</span>
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
