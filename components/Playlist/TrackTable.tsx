"use client";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ PACKAGE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Clock, Play, Heart, Trash, PlusCircle } from "lucide-react";
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
import { cn, formatDate, formatDuration } from "@/lib/utils";
import { usePlayerStore, useUserStore } from "@/store";
import { useLoginStatus } from "@/lib/hooks/useLoginStatus";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ COMPONENTS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function TrackRowContextMenu({ children, trackID, onPlay }: { children: React.ReactNode, trackID: number, onPlay: () => void }) {
  const playlists = useUserStore((state: any) => state.playlist);

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48 bg-[#282828] text-white border-white/10">
        <ContextMenuGroup>
          <ContextMenuItem onClick={onPlay} className="focus:bg-white/10 focus:text-white">
            <Play className="w-4 h-4 mr-2" />
            Play
          </ContextMenuItem>
          <ContextMenuItem className="focus:bg-white/10 focus:text-white">
            <Heart className="w-4 h-4 mr-2" />
            Add to Liked Songs
          </ContextMenuItem>
        </ContextMenuGroup>
        <ContextMenuSeparator className="bg-white/10" />
        <ContextMenuGroup>
          <ContextMenuSub>
            <ContextMenuSubTrigger className="focus:bg-white/10 focus:text-white">
              <PlusCircle className="w-4 h-4 mr-2" />
              Add to Playlist
            </ContextMenuSubTrigger>
            <ContextMenuSubContent className="w-40 bg-[#282828] text-white border-white/10">
              {useLoginStatus() && (playlists.map((playlist: any) => (
                <ContextMenuItem key={playlist.id} className="focus:bg-white/10 focus:text-white">
                  {playlist.name}
                </ContextMenuItem>
              )))}
            </ContextMenuSubContent>
          </ContextMenuSub>
        </ContextMenuGroup>
        <ContextMenuSeparator className="bg-white/10" />
        <ContextMenuGroup>
          <ContextMenuItem variant="destructive" className="focus:bg-red-500 focus:text-white">
            <Trash className="w-4 h-4 mr-2" />
            Remove from Playlist
          </ContextMenuItem>
        </ContextMenuGroup>
      </ContextMenuContent>
    </ContextMenu>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ UI ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export default function TracklistTable() {
  const tracks = useUserStore((state: any) => state.albumList);
  const { setQueue, playQueueIndex } = usePlayerStore.getState();
  const currentSongDetail = usePlayerStore((s: any) => s.currentSongDetail);

  const handlePlay = (index: number) => {
    setQueue(tracks, index);
    playQueueIndex(index);
  };

  return (
    <Table className="w-full text-zinc-400 table-fixed">
      {/* 表头 */}
      <TableHeader className={cn(
        "sticky top-0 z-10 backdrop-blur-sm drop-shadow-[0_8px_32px_rgba(255,255,255,0.15)]",
        "bg-linear-to-b from-transparent to-[#121212]/10"
      )}>
        <TableRow className="hover:bg-transparent border-none">
          <TableHead className="w-12 text-center text-zinc-400">#</TableHead>
          <TableHead className="text-zinc-400">Title</TableHead>
          <TableHead className="hidden md:table-cell text-zinc-400">Album</TableHead>
          <TableHead className="hidden lg:table-cell text-zinc-400">Date Published</TableHead>
          {/* 修改点：增加 w-32 锁定尾列宽度，增加 pr-8 留出与屏幕边缘的距离 */}
          <TableHead className="w-32 pr-8 text-zinc-400">
            <div className="flex justify-end items-center">
              <Clock className="w-4 h-4" />
            </div>
          </TableHead>
        </TableRow>
      </TableHeader>

      {/* 表身 */}
      <TableBody>
        {tracks.map((track: any, index: number) => {
          const isActive = currentSongDetail?.id === track.id;
          return (
            <TrackRowContextMenu key={track.id} trackID={track.id} onPlay={() => handlePlay(index)}>
              <TableRow
                className={cn(
                  "group hover:bg-white/10 border-none transition-colors cursor-default",
                  isActive && "text-[#1ed760]"
                )}
                onDoubleClick={() => handlePlay(index)}
              >
                <TableCell className="text-center font-medium rounded-l-md">
                  <span className={cn("group-hover:hidden", isActive && "hidden")}>
                    {isActive ? "♫" : index + 1}
                  </span>
                  <Play
                    className="w-4 h-4 hidden group-hover:inline-block text-white cursor-pointer"
                    fill="currentColor"
                    onClick={() => handlePlay(index)}
                  />
                </TableCell>
                {/* 封面 + 歌曲信息 */}
                <TableCell>
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-10 h-10 shrink-0 bg-zinc-800 rounded">
                      <img src={track.al.picUrl} alt={track.al.name} className="w-full h-full object-cover rounded" />
                    </div>
                    <div className="flex flex-col truncate">
                      <span
                        title={track.name}
                        className={cn(
                          "text-base font-normal truncate group-hover:underline cursor-pointer",
                          isActive ? "text-[#1ed760]" : "text-white"
                        )}
                      >
                        {track.name}
                      </span>
                      <span
                        title={track.ar.map((artist: any) => artist.name).join(", ")}
                        className="text-zinc-400 text-sm hover:text-white hover:underline cursor-pointer truncate"
                      >
                        {track.ar.map((artist: any) => artist.name).join(", ")}
                      </span>
                    </div>
                  </div>
                </TableCell>
                {/* 专辑名 */}
                <TableCell className="hidden md:table-cell truncate">
                  <span title={track.al.name} className="hover:text-white hover:underline cursor-pointer">
                    {track.al.name}
                  </span>
                </TableCell>
                {/* 发布时间 */}
                <TableCell className="hidden lg:table-cell truncate">
                  <span title={formatDate(track.publishTime)}>{formatDate(track.publishTime)}</span>
                </TableCell>
                {/* 修改点：同步增加 w-32 和 pr-8，确保与表头严格对齐 */}
                <TableCell className="w-32 pr-8 rounded-r-md">
                  <div className="flex justify-end items-center">
                    <span title={formatDuration(track.dt)}>{formatDuration(track.dt)}</span>
                  </div>
                </TableCell>
              </TableRow>
            </TrackRowContextMenu>
          );
        })}
      </TableBody>
    </Table>
  );
}
