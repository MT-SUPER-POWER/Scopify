// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ PACKAGE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Clock, Play, Heart, MoreHorizontal, Trash } from "lucide-react";
import { IoAddCircleOutline } from "react-icons/io5";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ PROPS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface Track {
  id: number;
  title: string;
  artist: string;
  album: string;
  addedBy: string;
  addedByAvatar: string;
  dateAdded: string;
  duration: string;
  img: string;
}

interface PlaylistTableProps {
  tracks: Track[];
}

interface TrackRowContextMenuProps {
  track: Track;
  children: React.ReactNode;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ COMPONENTS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function TrackRowContextMenu({ track, children }: TrackRowContextMenuProps) {
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

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ UI ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export default function PlaylistTable({ tracks }: PlaylistTableProps) {
  return (
    <Table className="w-full text-zinc-400">
      {/* 表头 */}
      <TableHeader className="sticky top-0 z-10 bg-[#121212]/95 backdrop-blur-sm border-b border-white/75">
        <TableRow className="hover:bg-transparent border-none">
          <TableHead className="w-12 text-center">#</TableHead>
          <TableHead>Title</TableHead>
          <TableHead className="hidden md:table-cell">Album</TableHead>
          <TableHead className="hidden lg:table-cell">Added By</TableHead>
          <TableHead className="hidden lg:table-cell">Date Added</TableHead>
          <TableHead className="text-right pr-4 flex items-center justify-center">
            <Clock className="w-4 h-4 inline-block" />
          </TableHead>
        </TableRow>
      </TableHeader>

      {/* 表身 */}
      <TableBody>
        {tracks.map((track, index) => (
          <TrackRowContextMenu key={track.id} track={track}>
            <TableRow
              className="group hover:bg-white/10 border-none transition-colors cursor-default"
            >
              <TableCell className="text-center font-medium rounded-l-md">
                <span className="group-hover:hidden">{index + 1}</span>
                <Play className="w-4 h-4 hidden group-hover:inline-block text-white" fill="currentColor" />
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-10 h-10 shrink-0 bg-zinc-800 rounded">
                    <img src={track.img} alt={track.title} className="w-full h-full object-cover rounded" />
                  </div>
                  <div className="flex flex-col truncate">
                    <span className="text-white text-base font-normal truncate group-hover:underline cursor-pointer">
                      {track.title}
                    </span>
                    <span className="text-zinc-400 text-sm hover:text-white hover:underline cursor-pointer truncate">
                      {track.artist}
                    </span>
                  </div>
                </div>
              </TableCell>
              <TableCell className="hidden md:table-cell truncate">
                <span className="hover:text-white hover:underline cursor-pointer">{track.album}</span>
              </TableCell>
              <TableCell className="hidden lg:table-cell truncate">
                <div className="flex items-center gap-2 hover:text-white hover:underline cursor-pointer">
                  <img src={track.addedByAvatar} alt="" className="w-6 h-6 rounded-full object-cover shrink-0" />
                  <span className="truncate">{track.addedBy}</span>
                </div>
              </TableCell>
              <TableCell className="hidden lg:table-cell truncate">
                {track.dateAdded}
              </TableCell>
              <TableCell className="text-right rounded-r-md pr-4">
                <div className="flex justify-end gap-4 items-center">
                  <Heart className="w-4 h-4 opacity-0 group-hover:opacity-100 hover:text-white cursor-pointer transition-opacity" />
                  <span>{track.duration}</span>
                  <MoreHorizontal className="w-4 h-4 opacity-0 group-hover:opacity-100 hover:text-white cursor-pointer transition-opacity" />
                </div>
              </TableCell>
            </TableRow>
          </TrackRowContextMenu>
        ))}
      </TableBody>
    </Table>
  );
}
