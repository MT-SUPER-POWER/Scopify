"use client";

import type { CSSProperties } from "react";
import type { CompanionLyricTextProps } from "@/types/desktopCompanion";

/** 逐字渐变的过渡宽度（相对单个字素），让填充边缘柔和一点。 */
const FEATHER = 12;

function glyphStyle(progress: number): CSSProperties {
  if (progress >= 1) return { color: "var(--lyric-played)" };
  if (progress <= 0) return { color: "var(--lyric-unplayed)" };
  const at = progress * (100 + FEATHER * 2) - FEATHER;
  return {
    backgroundImage: `linear-gradient(90deg, var(--lyric-played) ${at - FEATHER}%, var(--lyric-unplayed) ${at + FEATHER}%)`,
    backgroundClip: "text",
    WebkitBackgroundClip: "text",
    color: "transparent",
  };
}

/** 伴随窗口的单行歌词，颜色由父元素的 --lyric-played / --lyric-unplayed 决定。 */
export function CompanionLyricText({ text, progress }: CompanionLyricTextProps) {
  if (!progress) return <span style={{ color: "var(--lyric-played)" }}>{text}</span>;
  const graphemes = Array.from(
    new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(text),
    (part) => part.segment,
  );
  return (
    <span aria-label={text}>
      {graphemes.map((grapheme, index) => (
        <span key={index} aria-hidden="true" style={glyphStyle(progress[index] ?? 0)}>
          {grapheme}
        </span>
      ))}
    </span>
  );
}
