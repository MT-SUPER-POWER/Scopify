"use client";

import { useRef, useState } from "react";
import { cn, formatDuration } from "@/lib/utils";
import type { MvProgressBarProps } from "@/types/mv/components";

/**
 * YouTube 式进度条：悬停加粗并显示时间提示，可点击或拖动跳转；
 * 拖动期间只移动滑块，松手后才真正 seek，避免频繁请求视频分片。
 */
export function MvProgressBar({ currentTime, duration, buffered, onSeek }: MvProgressBarProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [hoverRatio, setHoverRatio] = useState<number | null>(null);
  const [dragRatio, setDragRatio] = useState<number | null>(null);
  const played = dragRatio ?? (duration > 0 ? currentTime / duration : 0);
  const bufferedRatio = duration > 0 ? buffered / duration : 0;

  const ratioAt = (clientX: number) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return 0;
    return Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
  };

  return (
    <div
      ref={trackRef}
      role="slider"
      tabIndex={-1}
      aria-valuemin={0}
      aria-valuemax={Math.round(duration)}
      aria-valuenow={Math.round(played * duration)}
      className="group/progress relative flex h-4 cursor-pointer items-center"
      onPointerMove={(event) => {
        const ratio = ratioAt(event.clientX);
        setHoverRatio(ratio);
        if (dragRatio !== null) setDragRatio(ratio);
      }}
      onPointerLeave={() => setHoverRatio(null)}
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        setDragRatio(ratioAt(event.clientX));
      }}
      onPointerUp={(event) => {
        if (dragRatio === null) return;
        onSeek(ratioAt(event.clientX) * duration);
        setDragRatio(null);
      }}
    >
      <div className="relative h-[3px] w-full bg-white/25 transition-[height] duration-100 group-hover/progress:h-[5px]">
        <div
          className="absolute inset-y-0 left-0 bg-white/40"
          style={{ width: `${bufferedRatio * 100}%` }}
        />
        {hoverRatio !== null && (
          <div
            className="absolute inset-y-0 left-0 bg-white/50"
            style={{ width: `${hoverRatio * 100}%` }}
          />
        )}
        <div className="absolute inset-y-0 left-0 bg-brand" style={{ width: `${played * 100}%` }} />
        <div
          className={cn(
            "absolute top-1/2 size-3.5 -translate-1/2 rounded-full bg-brand transition-transform duration-100",
            dragRatio !== null ? "scale-100" : "scale-0 group-hover/progress:scale-100",
          )}
          style={{ left: `${played * 100}%` }}
        />
      </div>
      {hoverRatio !== null && duration > 0 && (
        <span
          className="pointer-events-none absolute bottom-5 -translate-x-1/2 rounded bg-black/80 px-1.5 py-0.5 text-xs font-medium text-white tabular-nums"
          style={{ left: `${hoverRatio * 100}%` }}
        >
          {formatDuration(hoverRatio * duration * 1_000)}
        </span>
      )}
    </div>
  );
}
