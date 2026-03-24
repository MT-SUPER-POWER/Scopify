"use client";

import { memo, useEffect, useRef, useLayoutEffect, useState, useCallback } from "react";
import { Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { useVirtualizer } from "@tanstack/react-virtual";
import { usePlayerStore } from "@/store";
import Image from "next/image";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ COMPONENT ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const QueueRow = memo(
  ({
    song,
    index,
    isCurrent,
    onPlay,
  }: {
    song: any;
    index: number;
    isCurrent: boolean;
    onPlay: (index: number) => void;
  }) => (
    <button
      onClick={() => onPlay(index)}
      className={cn(
        "w-full flex items-center gap-4 px-4 py-3 rounded-2xl text-left transition-all duration-300",
        // 当前播放项增加玻璃高光和阴影，未播放项增加 hover 底色
        isCurrent ? "bg-white/15 shadow-sm ring-1 ring-white/10 scale-[1.02]" : "hover:bg-white/10"
      )}
    >
      <div className="w-10 h-10 shrink-0 rounded-lg overflow-hidden bg-white/10 shadow-inner">
        {song.al?.picUrl && (
          <Image
            width={40} height={40}
            src={`${song.al.picUrl}?param=64y64`}
            alt=""
            className="w-full h-full object-cover"
          />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn("text-[15px] truncate", isCurrent ? "text-[#1ed760] font-bold" : "text-white/90 font-medium")}>
          {song.name}
        </p>
        <p className="text-[13px] text-white/50 mt-0.5 truncate">
          {song.ar?.map((a: any) => a.name).join(", ")}
        </p>
      </div>
      {isCurrent && <Play className="w-4 h-4 text-[#1ed760] fill-current shrink-0" />}
    </button>
  )
);

QueueRow.displayName = "QueueRow";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ MAIN UI ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const QueuePanel = () => {
  const queue = usePlayerStore((s) => s.queue);
  const queueIndex = usePlayerStore((s) => s.queueIndex);
  const playQueueIndex = usePlayerStore((s) => s.playQueueIndex);

  const listRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);

  const virtualizer = useVirtualizer({
    count: queue.length,
    getScrollElement: () => listRef.current,
    estimateSize: () => 64, // 稍微增大了行高以适配更圆润的 UI
    overscan: 5,
  });

  // keep a ref so memoized children don't receive unstable functions
  const virtualizerRef = useRef(virtualizer);
  useEffect(() => {
    virtualizerRef.current = virtualizer;
  }, [virtualizer]);

  // stable proxy to call methods from memoized children
  const scrollToIndex = useCallback(
    (index: number, opts?: any) => {
      virtualizerRef.current?.scrollToIndex(index, opts);
    },
    []
  );

  // expose plain data (safe to pass to memoized children)
  const virtualItems = virtualizer.getVirtualItems?.() ?? [];

  useEffect(() => {
    if (queueIndex < 0) return;
    virtualizer.scrollToIndex(queueIndex, { align: "center", behavior: "smooth" });
  }, [queueIndex, virtualizer]);

  useLayoutEffect(() => {
    const el = listRef.current;
    if (!el) return;
    if (el.clientHeight > 0) Promise.resolve().then(() => setIsReady(true));
    const ro = new ResizeObserver((entries) => {
      const h = entries[0]?.contentRect?.height ?? 0;
      if (h > 0) setIsReady(true);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  if (!queue.length) {
    return (
      <div className="w-full h-full flex items-center justify-center text-white/40 text-sm">
        队列为空
      </div>
    );
  }

  return (
    // 🔥 苹果风格：透镜式玻璃面板容器
    <div className="w-full max-w-xl h-full mx-auto flex flex-col bg-white/5 backdrop-blur-[60px] rounded-[2.5rem] border border-white/10 shadow-[0_20px_60px_-10px_rgba(0,0,0,0.5)] overflow-hidden">

      {/* 顶部标题栏 */}
      <div className="px-8 py-6 border-b border-white/5 shrink-0">
        <h3 className="text-2xl font-bold text-white tracking-wide">待播清单</h3>
      </div>

      {/* 滚动区 */}
      <div
        ref={listRef}
        className="flex-1 w-full overflow-y-auto scrollbar-custom p-4"
      >
        {isReady ? (
          <div
            style={{ height: virtualizer.getTotalSize(), position: "relative" }}
            className="w-full"
          >
            {virtualizer.getVirtualItems().map((virtualRow: any) => {
              const song = queue[virtualRow.index];
              return (
                <div
                  key={`${song.id}-${virtualRow.index}`}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                    paddingBottom: "8px" // 增加项之间的间隙
                  }}
                >
                  <QueueRow
                    song={song}
                    index={virtualRow.index}
                    isCurrent={virtualRow.index === queueIndex}
                    onPlay={playQueueIndex}
                  />
                </div>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
};
