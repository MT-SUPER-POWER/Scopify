import { LANDING_CHAPTERS } from "@/constants/marketing";
import type { LandingChapterId } from "@/types/marketing";

interface LandingChapterLabelProps {
  chapter: LandingChapterId;
  className?: string;
}

/** 章节眉标：序号 + 英文乐段名 + 中文章节名，如「02 — Verse · 主歌」。 */
export function LandingChapterLabel({ chapter, className = "" }: LandingChapterLabelProps) {
  const index = LANDING_CHAPTERS.findIndex((item) => item.id === chapter);
  const { movement, title } = LANDING_CHAPTERS[index]!;

  return (
    <p
      className={`flex items-center gap-3 font-mono text-[0.68rem] tracking-[0.22em] text-white/50 uppercase ${className}`}
    >
      <span className="text-white/80 tabular-nums">{String(index + 1).padStart(2, "0")}</span>
      <span className="h-px w-8 bg-white/25" />
      <span>{movement}</span>
      <span className="tracking-[0.12em] text-white/35">{title.split(" · ")[0]}</span>
    </p>
  );
}
