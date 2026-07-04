"use client";

import { useVirtualizer } from "@tanstack/react-virtual";
import { Play } from "lucide-react";
import Image from "next/image";
import { type CSSProperties, memo, useEffect, useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { usePlayerStore } from "@/store";
import { useI18n } from "@/store/module/i18n";

const QueueRow = memo(
  ({
    song,
    index,
    isCurrent,
    onPlay,
    style,
  }: {
    song: any;
    index: number;
    isCurrent: boolean;
    onPlay: (index: number) => void;
    style?: CSSProperties;
  }) => (
    <button
      onClick={() => onPlay(index)}
      style={style} // 直接接收并应用 absolute 样式，省去外层包裹的 div
      className={cn(
        "group flex w-full items-center gap-4 rounded-2xl border px-4 py-3 text-left transition-all duration-300",
        isCurrent
          ? "border-white/20 bg-white/10 shadow-lg backdrop-blur-md"
          : "border-transparent bg-transparent hover:border-white/10 hover:bg-white/5",
      )}
    >
      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-white/10 shadow-sm">
        {song.al?.picUrl && (
          <Image
            width={48}
            height={48}
            src={`${song.al.picUrl}?param=64y64`}
            alt=""
            className={cn(
              "h-full w-full object-cover transition-transform duration-500 group-hover:scale-105",
              isCurrent ? "opacity-80" : "opacity-100",
            )}
          />
        )}
        {isCurrent && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[2px]">
            <Play className="h-5 w-5 fill-current text-white" />
          </div>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center">
        <p
          className={cn(
            "truncate text-[16px] tracking-wide transition-colors",
            isCurrent ? "font-semibold text-white" : "font-medium text-white/90",
          )}
        >
          {song.name}
        </p>
        <p className="mt-0.5 truncate text-[13px] font-light text-white/50">
          {song.ar?.map((a: any) => a.name).join(", ")}
        </p>
      </div>
    </button>
  ),
);

QueueRow.displayName = "QueueRow";

export const QueuePanel = () => {
  const { t } = useI18n();
  const queue = usePlayerStore((s) => s.queue);
  const queueIndex = usePlayerStore((s) => s.queueIndex);
  const playQueueIndex = usePlayerStore((s) => s.playQueueIndex);

  const listRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);

  // eslint-disable-next-line react-hooks/incompatible-library
  const virtualizer = useVirtualizer({
    count: queue.length,
    getScrollElement: () => listRef.current,
    estimateSize: () => 72, // 调整了 Row 的 padding，高度预估稍微调大
    overscan: 5,
  });

  const virtualizerRef = useRef(virtualizer);
  useEffect(() => {
    virtualizerRef.current = virtualizer;
  }, [virtualizer]);

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
      <div className="flex h-full w-full items-center justify-center text-sm text-white/40">
        {t("queue.empty")}
      </div>
    );
  }

  return (
    // 苹果高质感毛玻璃核心：高斯模糊 + 饱和度提升 + 微弱的白边 + 更大的圆角
    <div className="relative mx-auto flex h-full w-full max-w-xl flex-col overflow-hidden rounded-[32px] border border-white/8 bg-black/30 shadow-2xl backdrop-blur-[80px] backdrop-saturate-150">
      {/* 可选：添加极微弱的噪点遮罩增加真实玻璃物理质感 (需要你有一张噪点图或者用 CSS 滤镜，这里用 CSS 模拟) */}
      <div className="bg-noise pointer-events-none absolute inset-0 opacity-[0.02] mix-blend-overlay" />

      <div className="relative z-10 shrink-0 px-6 py-6">
        <h3 className="text-xl font-bold tracking-tight text-white">{t("queue.title")}</h3>
      </div>

      <div
        ref={listRef}
        className="scrollbar-custom relative z-10 w-full flex-1 overflow-y-auto px-3 pb-4"
      >
        {isReady ? (
          <div
            style={{ height: virtualizer.getTotalSize(), position: "relative" }}
            className="w-full"
          >
            {virtualizer.getVirtualItems().map((virtualRow: any) => {
              const song = queue[virtualRow.index];
              return (
                <QueueRow
                  key={`${song.id}-${virtualRow.index}`}
                  song={song}
                  index={virtualRow.index}
                  isCurrent={virtualRow.index === queueIndex}
                  onPlay={playQueueIndex}
                  // 将定位样式直接传入组件
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                    paddingBottom: "4px", // 给列表项之间留点缝隙，避免挤在一起
                  }}
                />
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
};
