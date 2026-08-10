import type { CSSProperties } from "react";

import { formatDuration } from "@/lib/utils";

interface DesktopPlaybackProgressControlProps {
  ariaLabel: string;
  durationMs: number;
  onSeek(positionMs: number): void;
  positionMs: number;
}

export function DesktopPlaybackProgressControl({
  ariaLabel,
  durationMs,
  onSeek,
  positionMs,
}: DesktopPlaybackProgressControlProps) {
  const safeDurationMs = Number.isFinite(durationMs) ? Math.max(0, durationMs) : 0;
  const safePositionMs = Math.min(
    safeDurationMs,
    Number.isFinite(positionMs) ? Math.max(0, positionMs) : 0,
  );
  const progressPercent = safeDurationMs > 0 ? (safePositionMs / safeDurationMs) * 100 : 0;
  const seekStyle = {
    "--desktop-controller-seek-progress": `${progressPercent}%`,
  } as CSSProperties;

  return (
    <div className="flex h-8 flex-col justify-center gap-0.5">
      <input
        type="range"
        aria-label={ariaLabel}
        aria-valuetext={`${formatDuration(safePositionMs)} / ${formatDuration(safeDurationMs)}`}
        className="desktop-controller-seek w-full cursor-pointer disabled:cursor-default disabled:opacity-45"
        disabled={safeDurationMs <= 0}
        max={Math.max(1, safeDurationMs)}
        min={0}
        onChange={(event) => onSeek(Number(event.currentTarget.value))}
        step={250}
        style={seekStyle}
        value={safePositionMs}
      />
      <div className="desktop-controller-muted flex justify-between text-[10px] leading-3 font-medium tabular-nums">
        <span>{formatDuration(safePositionMs)}</span>
        <span>{formatDuration(safeDurationMs)}</span>
      </div>
    </div>
  );
}
