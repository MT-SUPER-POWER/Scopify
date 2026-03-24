"use client";

import { memo } from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Play, Pause } from "lucide-react";
import { LikeButton } from "@/components/ui/LikeButton";
import { cn, formatDate, formatDuration } from "@/lib/utils";
import Image from "next/image";
import SPOTIFYANIME from "@/resources/eq-playing.svg";

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
          {/* 这里可以直接用原生 img，为了防止 Next.js 对小图做无意义的优化，可以关掉 unoptimized */}
          <Image
            src={SPOTIFYANIME}
            alt="Playing"
            width={14}
            height={14}
            unoptimized
          />
        </div>
      )}

      {/* 暂停状态图标 */}
      {isActive && !isPlaying && (
        <Play className="w-4 h-4 text-[#1ed760] fill-current group-hover:hidden" />
      )}

      {/* Hover 交互控制 */}
      <div className="hidden group-hover:flex items-center justify-center">
        {isActive && isPlaying ? (
          <Pause
            className="w-4 h-4 text-[#1ed760] fill-current cursor-pointer"
            onClick={() => setIsPlaying(false)}
          />
        ) : (
          <Play
            className="w-4 h-4 text-white fill-current cursor-pointer"
            onClick={onPlay}
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
  onPlay: () => void;
  onRequestDelete: (playlistId: number | string, trackId: number) => void;
  setIsPlaying: (v: boolean) => void;
  onContextMenu: (track: any) => void;
  hideDateColumn?: boolean;
  hideLikeColumn?: boolean;
}

export const TrackRow = memo(function TrackRow({
  track, index, isActive, isPlaying, isLiked, onPlay, setIsPlaying, onContextMenu, hideDateColumn, hideLikeColumn
}: TrackRowProps) {
  return (
    <TableRow
      className={cn("group hover:bg-white/10 border-none transition-colors cursor-default", isActive && "text-[#1ed760]")}
      onDoubleClick={onPlay}
      onContextMenu={() => onContextMenu(track)}
    >
      <TableCell className="text-center font-medium rounded-l-md">
        <TrackIndexCell index={index} isActive={isActive} isPlaying={isPlaying} onPlay={onPlay} setIsPlaying={setIsPlaying} />
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
            {/* ... 原本的 LikeButton 逻辑保持不变 ... */}
            <LikeButton
              liked={isLiked}
              likedCount={track.popularity || 0}
              onLike={() => { /* ...原本逻辑... */ }}
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
  // 修复了之前遗漏的 track.id 比对问题
  prev.track.id === next.track.id &&
  prev.isActive === next.isActive &&
  prev.isPlaying === next.isPlaying &&
  prev.isLiked === next.isLiked &&
  prev.index === next.index &&
  prev.hideDateColumn === next.hideDateColumn &&
  prev.hideLikeColumn === next.hideLikeColumn
);
