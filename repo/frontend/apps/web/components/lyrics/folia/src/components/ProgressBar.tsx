import React, { useCallback, useLayoutEffect, useRef } from "react";
import { MotionValue, useMotionValueEvent } from "framer-motion";
import {
  ProgressRangeMarkers,
  type ProgressRangeMarker,
} from "@scopify/ui/scopify/components/progress-range-markers";

interface ProgressBarProps {
  currentTime: MotionValue<number>;
  duration: number;
  onSeek: (time: number) => void;
  onSeekStart?: () => void;
  onSeekEnd?: () => void;
  primaryColor?: string;
  secondaryColor?: string;
  trackColor?: string;
  disabled?: boolean;
  rangeMarkers?: readonly ProgressRangeMarker[];
  markerColor?: string;
}

const formatTime = (time: number) => {
  if (isNaN(time)) return "00:00";
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
};

const ProgressBar: React.FC<ProgressBarProps> = ({
  currentTime,
  duration,
  onSeek,
  onSeekStart,
  onSeekEnd,
  primaryColor = "white",
  secondaryColor = "rgba(255,255,255,0.5)",
  trackColor = "rgba(255,255,255,0.1)",
  disabled = false,
  rangeMarkers = [],
  markerColor,
}) => {
  const effectiveMarkerColor = markerColor || primaryColor;
  const progressRef = useRef<HTMLDivElement>(null);
  const timeRef = useRef<HTMLSpanElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isDraggingRef = useRef(false);
  const lastDisplayedSecondRef = useRef<number | null>(null);
  const lastInputSecondRef = useRef<number | null>(null);

  // Keeps continuous progress on the compositor while coarse values update only when needed.
  const updateUI = useCallback(
    (value: number, force = false, syncInput = true, bypassDrag = false) => {
      if (!bypassDrag && isDraggingRef.current) return;

      const safeValue = Number.isFinite(value) ? Math.max(0, value) : 0;
      const clampedValue = duration > 0 ? Math.min(safeValue, duration) : safeValue;
      const displayedSecond = Math.floor(clampedValue);

      if (progressRef.current) {
        const progress = duration > 0 ? Math.min(1, clampedValue / duration) : 0;
        const hiddenPercent = ((1 - progress) * 100).toFixed(4);
        progressRef.current.style.clipPath = `inset(0 ${hiddenPercent}% 0 0 round 999px)`;
      }

      if (timeRef.current && (force || lastDisplayedSecondRef.current !== displayedSecond)) {
        timeRef.current.textContent = formatTime(clampedValue);
        lastDisplayedSecondRef.current = displayedSecond;
      }

      if (
        syncInput &&
        inputRef.current &&
        (force || lastInputSecondRef.current !== displayedSecond)
      ) {
        inputRef.current.value = clampedValue.toString();
        lastInputSecondRef.current = displayedSecond;
      }
    },
    [duration],
  );

  useLayoutEffect(() => {
    updateUI(currentTime.get(), true);
  }, [currentTime, updateUI]);

  useMotionValueEvent(currentTime, "change", (latest: number) => {
    updateUI(latest);
  });

  const handleInput = (e: React.FormEvent<HTMLInputElement>) => {
    if (disabled) {
      return;
    }
    const val = Number(e.currentTarget.value);
    updateUI(val, false, false, true);
  };

  const handleSeekStart = (e: React.PointerEvent<HTMLInputElement>) => {
    if (disabled) return;
    isDraggingRef.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    onSeekStart?.();
  };

  const handleSeekEnd = (e: React.PointerEvent<HTMLInputElement>) => {
    if (disabled) return;
    const value = Number(e.currentTarget.value);
    isDraggingRef.current = false;
    updateUI(value, true);
    onSeek(value);
    onSeekEnd?.();
  };

  const handleSeekCancel = () => {
    isDraggingRef.current = false;
    updateUI(currentTime.get(), true);
    onSeekEnd?.();
  };

  return (
    <div className="flex w-full items-center gap-3">
      <span
        ref={timeRef}
        className="w-8 text-right font-mono text-[10px] font-medium opacity-60"
        style={{ color: secondaryColor }}
      >
        00:00
      </span>

      <div
        className={`group relative flex h-1.5 flex-1 items-center rounded-sm md:rounded-full ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
        style={{ backgroundColor: trackColor }}
      >
        <div
          ref={progressRef}
          className="pointer-events-none absolute top-0 left-0 h-full rounded-sm md:rounded-full"
          style={{
            width: "100%",
            backgroundColor: primaryColor,
            clipPath: "inset(0 100% 0 0 round 999px)",
            willChange: "clip-path",
          }}
        />

        <ProgressRangeMarkers
          appearance="glow"
          color={effectiveMarkerColor}
          ranges={rangeMarkers}
        />
        <input
          ref={inputRef}
          type="range"
          min={0}
          max={duration || 100}
          step={0.1}
          disabled={disabled}
          defaultValue={0}
          onPointerDown={handleSeekStart}
          onPointerUp={handleSeekEnd}
          onPointerCancel={handleSeekCancel}
          onInput={handleInput}
          onChange={() => {}} // React requires this
          onClick={(e) => e.stopPropagation()}
          className={`absolute inset-0 size-full opacity-0 ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}
        />
      </div>

      <span
        className="w-8 font-mono text-[10px] font-medium opacity-60"
        style={{ color: secondaryColor }}
      >
        {formatTime(duration)}
      </span>
    </div>
  );
};

export default ProgressBar;
