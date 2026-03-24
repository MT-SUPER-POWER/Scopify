"use client";

import React, { useRef, memo, useCallback, useState, useEffect } from "react";
import { ListMusic, Play } from "lucide-react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { cn, formatDuration } from "@/lib/utils";
import { usePlayerStore } from "@/store";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { ScrollArea } from "./ui/scroll-area";
import Image from "next/image";
import SPOTIFYANIME from "@/resources/eq-playing.svg";


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 子组件解耦 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
interface QueueItemProps {
  song: any;
  index: number;
  isActive: boolean;
  isPlaying: boolean;
  virtualStart: number;
  virtualSize: number;
  onPlay: (index: number) => void;
}

// 使用 memo 阻断不必要的重渲染
const QueueItem = memo(function QueueItem({
  song,
  index,
  isActive,
  isPlaying,
  virtualStart,
  virtualSize,
  onPlay
}: QueueItemProps) {
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: `${virtualSize}px`,
        transform: `translateY(${virtualStart}px)`,
        paddingBottom: "4px",
      }}
    >
      <div
        onClick={() => onPlay(index)}
        className={cn(
          "group flex items-center gap-3 p-2 rounded-md cursor-pointer transition-all h-full",
          isActive ? "bg-white/10" : "hover:bg-white/5"
        )}
      >
        {/* 左侧：索引与封面 */}
        <div className="flex items-center gap-3 shrink-0 pr-1">
          <span className={cn(
            "text-[10px] w-4 text-center tabular-nums",
            isActive ? "text-[#1ed760]" : "text-zinc-500"
          )}>
            {(index + 1).toString().padStart(2, '0')}
          </span>

          <div className="relative w-10 h-10 shrink-0 flex items-center justify-center overflow-hidden rounded group/cover">
            <Image
              src={song.al.picUrl}
              alt={song.name}
              className={cn(
                "w-full h-full object-cover transition-opacity",
                isActive ? "opacity-40" : "group-hover/cover:opacity-40"
              )}
              fill
            />
            <div className="absolute inset-0 flex items-center justify-center">
              {isActive ? (
                isPlaying ? (
                  <Image
                    src={SPOTIFYANIME}
                    alt="Playing"
                    width={14}
                    height={14}
                    unoptimized
                  />
                ) : (
                  <Play className="w-4 h-4 text-[#1ed760] fill-current" />
                )
              ) : (
                <Play className="w-4 h-4 text-white fill-current opacity-0 group-hover/cover:opacity-100 transition-opacity" />
              )}
            </div>
          </div>
        </div>

        {/* 中间：歌曲信息 */}
        <div className="flex-1 min-w-0">
          <div className={cn(
            "text-sm truncate font-medium",
            isActive ? "text-[#1ed760]" : "text-white"
          )}>
            {song.name}
          </div>
          <div className="text-xs text-zinc-400 truncate mt-0.5">
            {song.ar.map((a: any) => a.name).join(", ")}
          </div>
        </div>

        {/* 右侧：时长 */}
        <div className="text-xs text-zinc-500 tabular-nums pr-1">
          {formatDuration(song.dt)}
        </div>
      </div>
    </div>
  );
}, (prev, next) => {
  // 仅在关键状态发生变化时重新渲染该行
  return (
    prev.isActive === next.isActive &&
    prev.isPlaying === next.isPlaying &&
    prev.virtualStart === next.virtualStart &&
    prev.song.id === next.song.id
  );
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 列表组件（Popover 打开后才挂载）━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const QueueList = () => {
  const queue = usePlayerStore((state) => state.queue);
  const queueIndex = usePlayerStore((state) => state.queueIndex);
  const playQueueIndex = usePlayerStore((state) => state.playQueueIndex);
  const isPlaying = usePlayerStore((state) => state.isPlaying);

  const parentRef = useRef<HTMLDivElement>(null);

  // eslint-disable-next-line react-hooks/incompatible-library
  const virtualizer = useVirtualizer({
    count: queue.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60,
    overscan: 5,
  });

  const handlePlay = useCallback((index: number) => {
    if (isPlaying === true && index === queueIndex) {
      playQueueIndex(-1);
    }
    playQueueIndex(index);
  }, [playQueueIndex, queueIndex, isPlaying]);

  // NOTE: 点击页面定位到播放的位置
  useEffect(() => {
    if (queueIndex < 0) return;
    virtualizer.scrollToIndex(queueIndex, { align: "center", behavior: "smooth" });
  }, [queueIndex, virtualizer]);

  return (
    <ScrollArea
      viewportRef={parentRef} // NOTE: 使用 ScrollArea 用这个 viewportRef 来替代直接操作 DOM 的 ref
      className="h-125 w-full"
    >
      <div className="p-2">
        {queue.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center text-zinc-500">
            <ListMusic className="w-10 h-10 opacity-60" />
          </div>
        ) : (
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: "100%",
              position: "relative",
            }}
          >
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const index = virtualRow.index;
              const song = queue[index];
              const isActive = index === queueIndex;

              return (
                <QueueItem
                  key={virtualRow.key}
                  song={song}
                  index={index}
                  isActive={isActive}
                  isPlaying={isPlaying}
                  virtualStart={virtualRow.start}
                  virtualSize={virtualRow.size}
                  onPlay={handlePlay}
                />
              );
            })}
          </div>
        )}
      </div>
    </ScrollArea>
  );
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 主组件 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const QueuePopover = () => {
  const queue = usePlayerStore((state: any) => state.queue);
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="text-zinc-400 hover:text-white transition-colors flex items-center justify-center" title="Play Queue">
          <ListMusic className="w-5 h-5" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end" className="w-96 bg-[#181818] border border-white/10 text-zinc-100 shadow-2xl">
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#181818]/90 backdrop-blur-sm sticky top-0 z-10">
          <div>
            <h3 className="font-bold text-lg">Current Queue</h3>
            <p className="text-xs text-zinc-400">Total Song: {queue.length}</p>
          </div>
        </div>
        <QueueList />
      </PopoverContent>
    </Popover>
  );
};

export default QueuePopover;
