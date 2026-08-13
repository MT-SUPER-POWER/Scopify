"use client";

import { useCallback } from "react";

import { SmoothSlider } from "@/components/SmoothSlider";
import { formatDuration } from "@/lib/utils";
import type { PlaybackProgressBarProps } from "@/types/components/player";

function normalizeTime(value: number, durationMs: number) {
  const finiteValue = Number.isFinite(value) ? Math.max(0, value) : 0;
  return durationMs > 0 ? Math.min(finiteValue, durationMs) : 0;
}

export function PlaybackProgressBar({
  ariaLabel,
  bufferedPositionMs = 0,
  durationMs,
  onSeek,
  positionMs,
  rangeMarkers = [],
  variant = "player",
}: PlaybackProgressBarProps) {
  const safeDurationMs = Number.isFinite(durationMs) ? Math.max(0, durationMs) : 0;
  const safePositionMs = normalizeTime(positionMs, safeDurationMs);
  const safeBufferedPositionMs = normalizeTime(bufferedPositionMs, safeDurationMs);
  const positionPercent = safeDurationMs > 0 ? (safePositionMs / safeDurationMs) * 100 : 0;
  const bufferedPercent = safeDurationMs > 0 ? (safeBufferedPositionMs / safeDurationMs) * 100 : 0;
  const isFolia = variant === "folia";

  const handleChange = useCallback(
    (value: number, isCommit: boolean) => {
      if (safeDurationMs <= 0) return;
      onSeek((value / 100) * safeDurationMs, isCommit);
    },
    [onSeek, safeDurationMs],
  );

  const slider = (
    <SmoothSlider
      ariaLabel={ariaLabel}
      ariaValueText={`${formatDuration(safePositionMs)} / ${formatDuration(safeDurationMs)}`}
      bufferedColor={isFolia ? "var(--desktop-controller-soft-hover)" : undefined}
      bufferedValue={bufferedPercent}
      className="flex-1"
      disabled={safeDurationMs <= 0}
      fillColor={isFolia ? "var(--desktop-controller-primary)" : undefined}
      hoverFillColor={isFolia ? "var(--desktop-controller-primary)" : undefined}
      markerAppearance="glow"
      markerColor={isFolia ? "var(--desktop-controller-primary)" : "var(--brand)"}
      onChange={handleChange}
      orientation="horizontal"
      rangeMarkers={rangeMarkers}
      thumbColor={isFolia ? "var(--desktop-controller-primary)" : undefined}
      thumbOnHover={true}
      thumbSize={isFolia ? 9 : 12}
      trackColor={isFolia ? "var(--desktop-controller-soft-hover)" : undefined}
      trackThickness={isFolia ? 3 : 4}
      value={positionPercent}
    />
  );

  if (isFolia) {
    return (
      <div className="flex h-8 flex-col justify-center gap-0.5">
        {slider}
        <div className="desktop-controller-muted flex justify-between text-[10px] leading-3 font-medium tabular-nums">
          <span>{formatDuration(safePositionMs)}</span>
          <span>{formatDuration(safeDurationMs)}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full items-center gap-2">
      <span className="text-content-muted w-10 shrink-0 text-right text-[11px] font-normal tracking-widest tabular-nums">
        {formatDuration(safePositionMs)}
      </span>
      {slider}
      <span className="text-content-muted w-10 shrink-0 text-[11px] font-normal tracking-widest tabular-nums">
        {formatDuration(safeDurationMs)}
      </span>
    </div>
  );
}
