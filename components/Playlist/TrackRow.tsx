"use client";

import { memo, useCallback, useMemo } from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Play, Pause } from "lucide-react";
import { LikeButton } from "@/components/ui/LikeButton";
import { cn, formatDate, formatDuration } from "@/lib/utils";
import Image from "next/image";
import SPOTIFYANIME from "@/resources/eq-playing.svg";
import { likeSong } from "@/lib/api/playlist";
import { useUserStore } from "@/store";
import { toast } from "sonner";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 子组件: 序号与播放状态 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function TrackIndexCell({ index, isActive, isPlaying, onPlay, setIsPlaying }: {
  index: number;
  isActive: boolean;
  isPlaying: boolean;
  onPlay: () => void;
  setIsPlaying: (v: boolean) => void;
}) {
  return (
    <div className="relative w-4 h-4 mx-auto flex items-center justify-center group/cell">
      <span className={cn("text-zinc-400 font-normal group-hover:hidden", isActive && "hidden")}>
        {index + 1}
      </span>

      {isActive && isPlaying && (
        <div className="flex items-end gap-0.5 h-3 shrink-0 group-hover:hidden">
          <Image
            src={SPOTIFYANIME}
            alt="Playing"
            width={14}
            height={14}
            unoptimized
          />
        </div>
      )}

      {isActive && !isPlaying && (
        <Play className="w-4 h-4 text-[#1ed760] fill-current group-hover:hidden" />
      )}

      <div className="hidden group-hover:flex items-center justify-center">
        {isActive && isPlaying ? (
          <Pause
            className="w-4 h-4 text-[#1ed760] fill-current cursor-pointer"
            onClick={() => setIsPlaying(false)}
          />
        ) : (
          <Play
            className="w-4 h-4 text-white fill-current cursor-pointer"
            onClick={() => onPlay()}
          />
        )}
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 主组件: 单行数据 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface TrackRowProps {
  track: any;
  index: number;
  isActive: boolean;
  isPlaying: boolean;
  isLiked: boolean;
  playlistID: string | null;
  onPlay: (track: any) => void;
  onRequestDelete: (playlistId: number | string, trackId: number) => void;
  setIsPlaying: (v: boolean) => void;
  onContextMenu: (track: any) => void;
  hideDateColumn?: boolean;
  hideLikeColumn?: boolean;
  onLikeToggle?: (trackID: number | string) => void;
}

export const TrackRow = memo(function TrackRow({
  track, index, isActive, isPlaying, isLiked,
  hideDateColumn, hideLikeColumn,
  onPlay, setIsPlaying, onContextMenu,
}: TrackRowProps) {

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ UTILS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  const handleLike = useCallback(async (nextLiked: boolean) => {
    try {
      await likeSong(track.id, nextLiked);
      const store = useUserStore.getState() as any;
      const current = Array.isArray(store.likeListIDs) ? store.likeListIDs : [];

      // 1. 本地乐观更新
      store.setLikeListIDs(nextLiked ? [...current, track.id] : current.filter((id: number) => id !== track.id));
      toast.success(nextLiked ? "Added to your Liked Songs" : "Removed from your Liked Songs");

      // 2. 触发全局 Sidebar 更新（解决封面等不同步的问题）
      if (store.triggerLibraryUpdate) {
        store.triggerLibraryUpdate();
      }

    } catch (error) {
      console.error("Failed to toggle like:", error);
    }
  }, [track]);

  return (
    <TableRow
      className={cn("group hover:bg-white/10 border-none transition-colors cursor-default", isActive && "text-[#1ed760]")}
      onDoubleClick={() => onPlay(track)}
      onContextMenu={() => onContextMenu(track)}
    >
      <TableCell className="text-center font-medium rounded-l-md">
        <TrackIndexCell index={index} isActive={isActive} isPlaying={isPlaying} onPlay={() => onPlay(track)} setIsPlaying={setIsPlaying} />
      </TableCell>

      <TableCell className="min-w-0 max-w-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 shrink-0 bg-zinc-800 rounded">
            <Image width={40} height={40} src={track.al.picUrl} alt={track.al.name} loading="lazy" className="w-full h-full object-cover rounded" />
          </div>
          <div className="flex flex-col truncate">
            <span title={track.name} className={cn("text-base font-normal truncate group-hover:underline cursor-pointer", isActive ? "text-[#1ed760]" : "text-white")}>
              {track.name}
            </span>
            <span title={track.ar.map((a: any) => a.name).join(", ")} className="text-zinc-400 text-sm hover:text-white hover:underline cursor-pointer truncate">
              {track.ar.map((a: any) => a.name).join(", ")}
            </span>
          </div>
        </div>
      </TableCell>

      <TableCell className="hidden md:table-cell max-w-0">
        <span title={track.al.name} className="hover:text-white hover:underline cursor-pointer block truncate">{track.al.name}</span>
      </TableCell>

      {!hideDateColumn && (
        <TableCell className="hidden lg:table-cell truncate">
          <span title={formatDate(track.publishTime)}>{formatDate(track.publishTime)}</span>
        </TableCell>
      )}

      {!hideLikeColumn && (
        <TableCell className="hidden lg:table-cell truncate w-20">
          <div className="w-full h-full flex justify-center">
            <LikeButton
              liked={isLiked}
              likedCount={track.popularity || 0}
              onLike={() => {
                handleLike(!isLiked);
              }}
              iconClassName="w-4.5 h-4.5"
            />
          </div>
        </TableCell>
      )}

      <TableCell className="w-32 rounded-r-md align-middle">
        <div className="flex justify-center items-center">
          <span title={formatDuration(track.dt)}>{formatDuration(track.dt)}</span>
        </div>
      </TableCell>
    </TableRow>
  );
}, (prev, next) =>
  prev.track.id === next.track.id &&
  prev.isActive === next.isActive &&
  prev.isPlaying === next.isPlaying &&
  prev.isLiked === next.isLiked &&
  prev.index === next.index &&
  prev.hideDateColumn === next.hideDateColumn &&
  prev.hideLikeColumn === next.hideLikeColumn
);
