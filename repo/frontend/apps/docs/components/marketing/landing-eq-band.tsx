"use client";

import { type Transition, motion } from "framer-motion";
import type { KeyboardEvent, PointerEvent } from "react";

import { LANDING_EQ_MAX_GAIN } from "@/constants/marketing";
import { gainToRatio } from "@/lib/marketing/eq-curve";

interface LandingEqBandProps {
  frequency: string;
  gain: number;
  onChange: (gain: number) => void;
  onDragChange: (isDragging: boolean) => void;
  transition: Transition;
}

const MIN_GAIN = -LANDING_EQ_MAX_GAIN;

const clampGain = (gain: number) =>
  Math.min(LANDING_EQ_MAX_GAIN, Math.max(MIN_GAIN, Math.round(gain * 2) / 2));

const KEY_STEPS: Record<string, number> = {
  ArrowUp: 1,
  ArrowRight: 1,
  ArrowDown: -1,
  ArrowLeft: -1,
};

/** 一个可拖动的竖向频段推子：指针按住拖动，或聚焦后用方向键微调。 */
export function LandingEqBand({
  frequency,
  gain,
  onChange,
  onDragChange,
  transition,
}: LandingEqBandProps) {
  const ratio = gainToRatio(gain, LANDING_EQ_MAX_GAIN);
  const fillTop = Math.min(ratio, 0.5) * 100;
  const fillHeight = Math.abs(ratio - 0.5) * 100;

  const updateFromPointer = (event: PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const nextRatio = (event.clientY - rect.top) / rect.height;
    onChange(clampGain(LANDING_EQ_MAX_GAIN - nextRatio * 2 * LANDING_EQ_MAX_GAIN));
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = KEY_STEPS[event.key];
    if (step === undefined) return;
    event.preventDefault();
    onChange(clampGain(gain + step));
  };

  return (
    <div
      role="slider"
      tabIndex={0}
      aria-label={`${frequency} Hz 增益`}
      aria-orientation="vertical"
      aria-valuemin={MIN_GAIN}
      aria-valuemax={LANDING_EQ_MAX_GAIN}
      aria-valuenow={gain}
      aria-valuetext={`${gain > 0 ? "+" : ""}${gain} dB`}
      onKeyDown={handleKeyDown}
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        onDragChange(true);
        updateFromPointer(event);
      }}
      onPointerMove={(event) => {
        if (event.currentTarget.hasPointerCapture(event.pointerId)) updateFromPointer(event);
      }}
      onPointerUp={() => onDragChange(false)}
      onPointerCancel={() => onDragChange(false)}
      className="group relative h-full cursor-ns-resize touch-none rounded-lg outline-none focus-visible:bg-white/5"
    >
      <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-white/10" />
      <motion.span
        className="absolute left-1/2 w-[3px] -translate-x-1/2 rounded-full bg-[#1ed760]/70"
        initial={false}
        animate={{ top: `${fillTop}%`, height: `${fillHeight}%` }}
        transition={transition}
      />
      <motion.span
        className="absolute left-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_0_4px_rgba(30,215,96,0.25),0_0_18px_rgba(30,215,96,0.7)] transition-transform group-hover:scale-125 group-focus-visible:scale-125"
        initial={false}
        animate={{ top: `${ratio * 100}%` }}
        transition={transition}
      />
    </div>
  );
}
