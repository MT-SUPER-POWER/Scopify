"use client";

import { memo, useEffect, useRef, useLayoutEffect, useState } from "react";
import { Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePlayerStore } from "@/store";
import { useVirtualizer } from "@tanstack/react-virtual";


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
        "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-left transition-colors",
        isCurrent ? "bg-white/15" : "hover:bg-white/8"
      )}
    >
      <div className="w-8 h-8 shrink-0 rounded-md overflow-hidden bg-white/10">
        {song.al?.picUrl && (
          <img
            src={`${song.al.picUrl}?param=64y64`}
            alt=""
            className="w-full h-full object-cover"
          />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm truncate", isCurrent ? "text-[#1ed760] font-semibold" : "text-white")}>
          {song.name}
        </p>
        <p className="text-xs text-[#b3b3b3] truncate">
          {song.ar?.map((a: any) => a.name).join(", ")}
        </p>
      </div>
      {isCurrent && <Play className="w-3.5 h-3.5 text-[#1ed760] fill-current shrink-0" />}
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
    estimateSize: () => 56,
    overscan: 5,
  });

  useEffect(() => {
    if (queueIndex < 0) return;
    // ✅ 用 virtualizer 自带的方法，而不是直接操作 DOM
    virtualizer.scrollToIndex(queueIndex, { align: "center", behavior: "smooth" });
  }, [queueIndex]);

  // Ensure we don't render virtual items until the scroll container has a measured height.
  // If the container has no height (auto), virtualization will treat it as unbounded
  // and may render all items. Use a ResizeObserver to detect when the container size is known.
  useLayoutEffect(() => {
    const el = listRef.current;
    if (!el) return;
    if (el.clientHeight > 0) setIsReady(true);
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
    // 外层：负责滚动
    <div
      ref={listRef}
      className="w-full h-full overflow-y-auto scrollbar-custom"
    >
      {/* 如果容器尚未测量出高度，先不要渲染虚拟项，避免渲染全部元素 */}
      {isReady ? (
        <div
          style={{ height: virtualizer.getTotalSize(), position: "relative" }}
          className="px-2 py-2"
        >
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const song = queue[virtualRow.index];
            return (
              // ✅ 用 transform 绝对定位每一项
              <div
                key={`${song.id}-${virtualRow.index}`}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
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
      ) : (
        <div className="px-2 py-2" />
      )}
    </div>
  );
};
