"use client";

import { useVirtualizer } from "@tanstack/react-virtual";
import { ListMusic, LocateFixed, Play } from "lucide-react"; // 添加定位图标
import Image from "next/image";
import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { ArtistInlineLinks } from "@/components/shared/ArtistInlineLinks";
import { SongContextMenu } from "@/components/shared/SongContextMenu";
import { cn, formatDuration } from "@/lib/utils";
import SPOTIFYANIME from "@/resources/eq-playing.svg";
import { usePlayerStore } from "@/store";
import { useI18n } from "@/store/module/i18n";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { ScrollArea } from "./ui/scroll-area";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 子组件保持不变 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
interface QueueItemProps {
  song: any;
  index: number;
  isActive: boolean;
  isPlaying: boolean;
  virtualStart: number;
  virtualSize: number;
  onPlay: (index: number) => void;
  onRemove: (index: number) => void;
}

const QueueItem = memo(
  function QueueItem({
    song,
    index,
    isActive,
    isPlaying,
    virtualStart,
    virtualSize,
    onPlay,
    onRemove,
  }: QueueItemProps) {
    const { t } = useI18n();

    return (
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: `${virtualSize}px`,
          transform: `translateY(${virtualStart}px)`,
        }}
        className="px-2"
      >
        <motion.div
          initial={{ opacity: 0, y: 30, rotateX: 10 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{
            duration: 0.4,
            ease: "easeOut",
            delay: (index % 10) * 0.05,
          }}
          className="h-full w-full"
        >
          <SongContextMenu
            song={song}
            isActive={isActive}
            isPlaying={isPlaying}
            onPlay={() => onPlay(index)}
            onRemoveFromQueue={() => onRemove(index)}
          >
            <div
              onClick={() => onPlay(index)}
              className={cn(
                "group flex h-full cursor-pointer items-center gap-3 rounded-md p-4 transition-all",
                isActive ? "bg-white/10" : "hover:bg-white/5",
              )}
            >
              <div className="flex shrink-0 items-center gap-3 pr-1">
                <span
                  className={cn(
                    "w-4 text-center text-[10px] tabular-nums",
                    isActive ? "text-[#1ed760]" : "text-zinc-500",
                  )}
                >
                  {(index + 1).toString().padStart(2, "0")}
                </span>

                <div className="group/cover relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded">
                  <Image
                    src={song.al.picUrl}
                    alt={song.name}
                    className={cn(
                      "h-full w-full object-cover transition-opacity",
                      isActive ? "opacity-40" : "group-hover/cover:opacity-40",
                    )}
                    fill
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    {isActive ? (
                      isPlaying ? (
                        <Image
                          src={SPOTIFYANIME}
                          alt={t("common.status.playing")}
                          width={14}
                          height={14}
                          unoptimized
                        />
                      ) : (
                        <Play className="h-4 w-4 fill-current text-[#1ed760]" />
                      )
                    ) : (
                      <Play className="h-4 w-4 fill-current text-white opacity-0 transition-opacity group-hover/cover:opacity-100" />
                    )}
                  </div>
                </div>
              </div>

              <div className="min-w-0 flex-1">
                <div
                  className={cn(
                    "truncate text-sm font-medium",
                    isActive ? "text-[#1ed760]" : "text-white",
                  )}
                >
                  {song.name}
                </div>
                <div className="mt-0.5 truncate text-xs text-zinc-400">
                  <ArtistInlineLinks
                    artists={song.ar.map((a: { id: number; name: string }) => ({
                      id: a.id,
                      name: a.name,
                    }))}
                  />
                </div>
              </div>

              <div className="pr-1 text-xs text-zinc-500 tabular-nums">
                {formatDuration(song.dt)}
              </div>
            </div>
          </SongContextMenu>
        </motion.div>
      </div>
    );
  },
  (prev, next) => {
    return (
      prev.isActive === next.isActive &&
      prev.isPlaying === next.isPlaying &&
      prev.virtualStart === next.virtualStart &&
      prev.song.id === next.song.id
    );
  },
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 列表组件 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const QueueList = ({ isOpen }: { isOpen: boolean }) => {
  const { t } = useI18n();
  const queue = usePlayerStore((state) => state.queue);
  const queueIndex = usePlayerStore((state) => state.queueIndex);
  const playQueueIndex = usePlayerStore((state) => state.playQueueIndex);
  const isPlaying = usePlayerStore((state) => state.isPlaying);

  const parentRef = useRef<HTMLDivElement>(null);
  // 用 ref 记录是否已经执行过初始滚动
  const hasScrolledOnOpen = useRef(false);

  // eslint-disable-next-line react-hooks/incompatible-library
  const virtualizer = useVirtualizer({
    count: queue.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60,
    overscan: 5,
  });

  const handlePlay = useCallback(
    (index: number) => {
      if (isPlaying === true && index === queueIndex) {
        usePlayerStore.setState({ isPlaying: false });
      }
      playQueueIndex(index);
    },
    [playQueueIndex, queueIndex, isPlaying],
  );

  const handleRemove = useCallback(
    (indexToRemove: number) => {
      const state = usePlayerStore.getState();
      const newQueue = state.queue.filter((_, i) => i !== indexToRemove);

      let nextIndex = state.queueIndex;
      if (indexToRemove < state.queueIndex) {
        nextIndex = state.queueIndex - 1;
      } else if (indexToRemove === state.queueIndex) {
        if (newQueue.length === 0) {
          nextIndex = -1;
          usePlayerStore.setState({
            isPlaying: false,
            currentSongUrl: null,
            currentSongDetail: null,
          });
        } else {
          nextIndex = Math.min(indexToRemove, newQueue.length - 1);
        }
      }

      const songToRemove = state.queue[indexToRemove];
      if (!songToRemove) return;
      const newOriginal = state.originalQueue.filter((s) => s.id !== songToRemove.id);

      usePlayerStore.setState({
        queue: newQueue,
        originalQueue: newOriginal,
        queueIndex: nextIndex,
      });

      if (indexToRemove === state.queueIndex && newQueue.length > 0) {
        state.playQueueIndex(nextIndex);
      }
      toast.success(t("contextMenu.removeFromQueue"));
    },
    [t],
  );

  // 手动定位到当前播放歌曲
  const _scrollToCurrent = useCallback(() => {
    if (queueIndex < 0) return;
    virtualizer.scrollToIndex(queueIndex, { align: "center", behavior: "smooth" });
  }, [queueIndex, virtualizer]);

  // 只在首次打开 Popover 时滚动到当前播放位置
  useEffect(() => {
    if (isOpen && !hasScrolledOnOpen.current && queueIndex >= 0) {
      // 使用 requestAnimationFrame 确保 DOM 已准备好
      requestAnimationFrame(() => {
        virtualizer.scrollToIndex(queueIndex, { align: "center", behavior: "auto" });
        hasScrolledOnOpen.current = true;
      });
    }

    // 关闭时重置标记，这样下次打开还是会定位到当前歌曲
    // 如果你希望完全记住位置，删除下面这行
    if (!isOpen) {
      hasScrolledOnOpen.current = false;
    }
  }, [isOpen, queueIndex, virtualizer]);

  return (
    <ScrollArea viewportRef={parentRef} className="h-125 w-full">
      <div className="p-2">
        {queue.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-zinc-500">
            <ListMusic className="h-10 w-10 opacity-60" />
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
                  onRemove={handleRemove}
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
  const { t } = useI18n();
  const queue = usePlayerStore((state: any) => state.queue);
  const queueIndex = usePlayerStore((state: any) => state.queueIndex);
  const [open, setOpen] = useState(false);

  const parentRef = useRef<HTMLDivElement>(null);

  // eslint-disable-next-line react-hooks/incompatible-library
  const virtualizer = useVirtualizer({
    count: queue.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 70,
    overscan: 5,
  });

  // 手动定位到当前播放歌曲（通过 ref 调用子组件方法）
  const scrollToCurrent = useCallback(() => {
    if (queueIndex < 0) return;
    virtualizer.scrollToIndex(queueIndex, { align: "center", behavior: "smooth" });
  }, [queueIndex, virtualizer]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex items-center justify-center text-zinc-400 transition-colors hover:text-white"
          title={t("queue.triggerTitle")}
        >
          <ListMusic className="h-5 w-5" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-96 border border-white/10 bg-[#181818] p-0 text-zinc-100 shadow-2xl"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-[#181818]/90 p-4 backdrop-blur-sm">
          <div>
            <h3 className="text-lg font-bold">{t("queue.title")}</h3>
            <p className="text-xs text-zinc-400">
              {t("queue.totalSongs", { count: queue.length })}
            </p>
          </div>
          {/* 添加定位按钮 */}
          <button
            type="button"
            onClick={scrollToCurrent}
            className="rounded-full p-2 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
            title={t("queue.locateCurrent")}
          >
            <LocateFixed className="h-4 w-4" />
          </button>
        </div>
        <QueueList isOpen={open} />
      </PopoverContent>
    </Popover>
  );
};

export default QueuePopover;
