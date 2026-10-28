"use client";

import type { UpdateProgressRingProps } from "@/types/notifications/components";

const RADIUS = 18;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** 包在通知铃铛外的环形进度：下载更新时逐步填满，下载完成后保持满环等待安装。 */
export function UpdateProgressRing({ state, strokeWidth = 2 }: UpdateProgressRingProps) {
  const downloading = state.status === "downloading";
  const downloaded = state.status === "downloaded";
  if (!downloading && !downloaded) return null;

  const percent = downloaded
    ? 100
    : typeof state.percent === "number" && Number.isFinite(state.percent)
      ? Math.min(100, Math.max(0, state.percent))
      : 0;

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 40 40"
      className="pointer-events-none absolute inset-0 size-full -rotate-90"
    >
      <circle
        cx="20"
        cy="20"
        r={RADIUS}
        fill="none"
        strokeWidth={strokeWidth}
        className="stroke-content-muted/20"
      />
      <circle
        cx="20"
        cy="20"
        r={RADIUS}
        fill="none"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={CIRCUMFERENCE}
        strokeDashoffset={CIRCUMFERENCE * (1 - percent / 100)}
        className={`transition-[stroke-dashoffset] duration-300 ease-out motion-reduce:transition-none ${downloaded ? "stroke-success" : "stroke-brand"}`}
      />
    </svg>
  );
}
