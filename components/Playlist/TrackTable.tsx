// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ PACKAGE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { IoAddCircleOutline } from "react-icons/io5";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Clock, Play, Heart, Trash } from "lucide-react";
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
import { useLoginStatus } from "@/lib/hooks/useLoginStatus";
import { useUserStore } from '@store/index';
import { usePlayerStore } from "@/store";
import { SongDetail } from "@/types/api/music";


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ COMPONENTS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function TrackRowContextMenu({ children, trackID, onPlay }: { children: React.ReactNode, trackID: number, onPlay: () => void }) {
  const playlists = useUserStore((state) => state.playlist);

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        <ContextMenuGroup>
          <ContextMenuItem onClick={onPlay}>
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
              {useLoginStatus() && (playlists.map(playlist => (
                <ContextMenuItem key={playlist.id}>{playlist.name}</ContextMenuItem>
              )))}
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

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ UI ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export default function TracklistTable() {
  const tracks = useUserStore((state) => state.albumList);
  const { setQueue, playQueueIndex } = usePlayerStore.getState();
  const currentSongDetail = usePlayerStore(s => s.currentSongDetail);

  const handlePlay = (index: number) => {
    setQueue(tracks, index);
    playQueueIndex(index);
  };

  return (

    <Table className="w-full text-zinc-400">
      {/* 表头 */}
      <TableHeader className={cn(
        "sticky top-0 z-10 backdrop-blur-sm border-b border-white/75",
        "bg-linear-to-b from-transparent to-[#121212]"
      )}>
        <TableRow className="hover:bg-transparent border-none">
          <TableHead className="w-12 text-center">#</TableHead>
          <TableHead>Title</TableHead>
          <TableHead className="hidden md:table-cell">Album</TableHead>
          <TableHead className="hidden lg:table-cell">Date Published</TableHead>
          <TableHead className="flex items-center">
            <Clock className="w-4 h-4" />
          </TableHead>
        </TableRow>
      </TableHeader>

      {/* 表身 */}
      <TableBody>
        {tracks.map((track, index) => {
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
                      <span className={cn(
                        "text-base font-normal truncate group-hover:underline cursor-pointer",
                        isActive ? "text-[#1ed760]" : "text-white"
                      )}>
                        {track.name}
                      </span>
                      <span className="text-zinc-400 text-sm hover:text-white hover:underline cursor-pointer truncate">
                        {track.ar.map(artist => artist.name).join(", ")}
                      </span>
                    </div>
                  </div>
                </TableCell>
                {/* 专辑名 */}
                <TableCell className="hidden md:table-cell truncate">
                  <span className="hover:text-white hover:underline cursor-pointer">
                    {track.al.name}
                  </span>
                </TableCell>
                {/* 发布时间 */}
                <TableCell className="hidden lg:table-cell truncate">
                  {formatDate(track.publishTime)}
                </TableCell>
                <TableCell className="rounded-r-md">
                  <div className="flex justify-end gap-4 items-center">
                    <span>{formatDuration(track.dt)}</span>
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
