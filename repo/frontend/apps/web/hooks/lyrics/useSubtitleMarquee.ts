"use client";

import { useEffect, useRef } from "react";
import { computeMarqueeOffset } from "@/lib/lyrics/desktopLyricLayout";
import { subtitlePlaybackPosition } from "@/lib/settings/subtitlePlayback";
import type { SubtitlePlayback } from "@/types/lyrics/subtitlePreview";

/**
 * 单行字幕超出容器时，按本句播放进度把内容横向滚到末尾。
 * 直接写 transform，不经过 React 渲染，避免每帧重渲染整行逐字填充。
 */
export function useSubtitleMarquee(
  playback: SubtitlePlayback,
  durationMs: number,
  enabled: boolean,
) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const viewport = viewportRef.current;
    const content = contentRef.current;
    if (!enabled || !viewport || !content) return;

    let frame = 0;
    let distance = 0;
    const draw = () => {
      const elapsed = subtitlePlaybackPosition(playback, durationMs, false, performance.now());
      const offset = computeMarqueeOffset(elapsed, durationMs, distance);
      content.style.transform = offset ? `translateX(${offset.toFixed(2)}px)` : "";
      if (playback.startedAt !== null && distance > 0 && elapsed < durationMs) {
        frame = requestAnimationFrame(draw);
      }
    };
    const restart = () => {
      cancelAnimationFrame(frame);
      distance = Math.max(0, content.scrollWidth - viewport.clientWidth);
      draw();
    };

    const observer = new ResizeObserver(restart);
    observer.observe(viewport);
    observer.observe(content);
    restart();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      content.style.transform = "";
    };
  }, [playback, durationMs, enabled]);

  return { viewportRef, contentRef };
}
