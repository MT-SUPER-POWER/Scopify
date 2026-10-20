"use client";

import { type MotionValue, motion, useMotionValueEvent } from "framer-motion";
import { type KeyboardEvent, type PointerEvent, useState } from "react";

import { scrollPageTo } from "@/lib/marketing/landing-time";
import type { LandingChapterOffset } from "@/types/marketing";

interface LandingPlayerProgressProps {
  offsets: readonly LandingChapterOffset[];
  progress: MotionValue<number>;
  reducedMotion: boolean;
}

const KEYBOARD_STEP = 0.04;

const seekTo = (fraction: number, reducedMotion: boolean) => {
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  scrollPageTo(Math.min(1, Math.max(0, fraction)) * maxScroll, reducedMotion);
};

/** 整页滚动进度条：按真实章节位置画分段刻度，点击或方向键可以「拖动进度」。 */
export function LandingPlayerProgress({
  offsets,
  progress,
  reducedMotion,
}: LandingPlayerProgressProps) {
  const [percent, setPercent] = useState(0);
  useMotionValueEvent(progress, "change", (value) => setPercent(Math.round(value * 100)));

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    seekTo((event.clientX - rect.left) / rect.width, reducedMotion);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const direction = { ArrowLeft: -1, ArrowDown: -1, ArrowRight: 1, ArrowUp: 1 }[event.key];
    if (!direction) return;
    event.preventDefault();
    seekTo(progress.get() + direction * KEYBOARD_STEP, true);
  };

  return (
    <div
      role="slider"
      tabIndex={0}
      aria-label="页面进度"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      onPointerDown={handlePointerDown}
      onKeyDown={handleKeyDown}
      className="group relative flex h-6 flex-1 cursor-pointer items-center outline-none"
    >
      <span className="relative h-[3px] w-full overflow-hidden rounded-full bg-white/12 transition-[height] group-hover:h-[5px] group-focus-visible:h-[5px]">
        <motion.span
          className="absolute inset-0 origin-left rounded-full bg-linear-to-r from-white/70 to-[#1ed760]"
          style={{ scaleX: progress }}
        />
      </span>
      {offsets.slice(1).map((offset) => (
        <span
          key={offset.id}
          aria-hidden="true"
          className="absolute top-1/2 h-2 w-px -translate-y-1/2 bg-white/35"
          style={{ left: `${offset.fraction * 100}%` }}
        />
      ))}
    </div>
  );
}
