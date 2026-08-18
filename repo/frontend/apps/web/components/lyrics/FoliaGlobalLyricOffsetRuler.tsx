"use client";

import { useEffect, useMemo, useRef } from "react";

import { colorWithAlpha } from "@/components/lyrics/folia/src/components/visualizer/colorMix";

interface FoliaGlobalLyricOffsetRulerProps {
  accentColor: string;
  ariaLabel: string;
  limitMs: number;
  onChange: (value: number) => void;
  secondaryColor: string;
  valueMs: number;
}

const PX_PER_MS = 0.6;
const clamp = (value: number, limit: number) =>
  Math.round(Math.max(-limit, Math.min(limit, value)));

export function FoliaGlobalLyricOffsetRuler({
  accentColor,
  ariaLabel,
  limitMs,
  onChange,
  secondaryColor,
  valueMs,
}: FoliaGlobalLyricOffsetRulerProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ id: number; startValue: number; startX: number } | null>(null);
  const valueRef = useRef(valueMs);
  const changeRef = useRef(onChange);
  valueRef.current = valueMs;
  changeRef.current = onChange;
  const ticks = useMemo(
    () => Array.from({ length: (limitMs / 25) * 2 + 1 }, (_, index) => -limitMs + index * 25),
    [limitMs],
  );

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const wheel = (event: WheelEvent) => {
      const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
      if (!delta) return;
      event.preventDefault();
      changeRef.current(
        clamp(valueRef.current + Math.max(-20, Math.min(20, delta)) / PX_PER_MS, limitMs),
      );
    };
    track.addEventListener("wheel", wheel, { passive: false });
    return () => track.removeEventListener("wheel", wheel);
  }, [limitMs]);

  return (
    <div
      aria-label={ariaLabel}
      aria-valuemax={limitMs}
      aria-valuemin={-limitMs}
      aria-valuenow={valueMs}
      className="relative h-17 w-full cursor-ew-resize touch-none outline-none select-none"
      onKeyDown={(event) => {
        const step = event.shiftKey ? 10 : 1;
        const values: Record<string, number | undefined> = {
          ArrowLeft: valueMs - step,
          ArrowDown: valueMs - step,
          ArrowRight: valueMs + step,
          ArrowUp: valueMs + step,
          PageDown: valueMs - 100,
          PageUp: valueMs + 100,
          Home: 0,
        };
        const next = values[event.key];
        if (next === undefined) return;
        event.preventDefault();
        onChange(clamp(next, limitMs));
      }}
      onPointerCancel={(event) => {
        if (dragRef.current?.id === event.pointerId) dragRef.current = null;
      }}
      onPointerDown={(event) => {
        if (event.button !== 0) return;
        dragRef.current = { id: event.pointerId, startValue: valueMs, startX: event.clientX };
        event.currentTarget.setPointerCapture(event.pointerId);
        event.currentTarget.focus();
      }}
      onPointerMove={(event) => {
        const drag = dragRef.current;
        if (drag?.id !== event.pointerId) return;
        onChange(clamp(drag.startValue - (event.clientX - drag.startX) / PX_PER_MS, limitMs));
      }}
      onPointerUp={(event) => {
        if (dragRef.current?.id === event.pointerId) dragRef.current = null;
      }}
      ref={trackRef}
      role="slider"
      tabIndex={0}
    >
      <div
        className="absolute inset-0 overflow-hidden"
        style={{
          maskImage: "linear-gradient(to right, transparent, #000 12%, #000 88%, transparent)",
        }}
      >
        <div
          className="absolute inset-x-0 top-3"
          style={{ transform: `translate3d(${-valueMs * PX_PER_MS}px,0,0)` }}
        >
          {ticks.map((ms) => {
            const major = ms % 100 === 0;
            const labelled = ms % 200 === 0;
            return (
              <div
                className="absolute top-0 w-0"
                key={ms}
                style={{ left: `calc(50% + ${ms * PX_PER_MS}px)` }}
              >
                <div
                  className="absolute top-0 left-0 -translate-x-1/2"
                  style={{
                    backgroundColor: colorWithAlpha(secondaryColor, 0.5),
                    height: labelled ? 22 : major ? 16 : 8,
                    width: ms === 0 ? 2 : 1,
                  }}
                />
                {labelled ? (
                  <span
                    className="absolute top-8 left-0 -translate-x-1/2 font-mono text-[10px]"
                    style={{ color: colorWithAlpha(secondaryColor, 0.72) }}
                  >
                    {ms > 0 ? `+${ms}` : ms}
                  </span>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
      <div
        className="pointer-events-none absolute top-0 left-1/2 h-10 w-0.5 -translate-x-1/2 rounded-full"
        style={{
          backgroundColor: accentColor,
          boxShadow: `0 0 12px ${colorWithAlpha(accentColor, 0.72)}`,
        }}
      />
    </div>
  );
}
