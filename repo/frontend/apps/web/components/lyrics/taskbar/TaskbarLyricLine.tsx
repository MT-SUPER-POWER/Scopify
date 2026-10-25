"use client";

import { CompanionLyricText } from "@/components/lyrics/companion/CompanionLyricText";
import { useSubtitleMarquee } from "@/hooks/lyrics/useSubtitleMarquee";
import { cn } from "@/lib/utils";
import type { TaskbarLyricLineProps } from "@/types/taskbarLyric";

const SECONDARY_SCALE = 0.82;
const STILL = { position: 0, startedAt: null };

/** 任务栏里的一行：主行带逐字填充，超长时按本句进度横向滚动；副行只做省略。 */
export function TaskbarLyricLine({
  item,
  fontSize,
  align,
  playback,
  lineDurationMs = 0,
}: TaskbarLyricLineProps) {
  const primary = item.role === "primary";
  const marquee = useSubtitleMarquee(playback ?? STILL, lineDurationMs, primary && !!playback);

  return (
    <div
      ref={marquee.viewportRef}
      className={cn(
        "flex w-full min-w-0 animate-in overflow-hidden whitespace-nowrap duration-300 fade-in slide-in-from-bottom-3",
        align === "right" ? "justify-[safe_flex-end]" : "justify-start",
        primary ? "text-(--tbl-primary)" : "text-(--tbl-secondary)",
      )}
      style={{ fontSize: primary ? fontSize : fontSize * SECONDARY_SCALE, lineHeight: 1.25 }}
    >
      <span ref={marquee.contentRef} className={cn("shrink-0", !primary && "truncate")}>
        <CompanionLyricText text={item.text} progressLine={item.progressLine} />
      </span>
    </div>
  );
}
