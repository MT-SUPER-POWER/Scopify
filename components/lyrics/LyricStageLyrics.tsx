"use client";

import { useEffect, useRef } from "react";

import type { LyricDisplayLine, LyricStageLyricsProps } from "@/types/lyrics";

import { getWordProgress } from "@/lib/lyrics/timeline";
import { cn } from "@/lib/utils";

export function LyricStageLyrics({
  activeLineIndex,
  currentTimeMs,
  fontScale,
  lines,
  showRomanization,
  showTranslation,
}: LyricStageLyricsProps) {
  const activeLineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    activeLineRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [activeLineIndex]);

  return (
    <div className="h-[min(66vh,44rem)] w-full [scrollbar-width:none] overflow-y-auto [&::-webkit-scrollbar]:hidden">
      <div className="min-h-full py-[30vh] text-[clamp(1.65rem,4.5vw,4.5rem)] leading-[1.14]">
        {lines.map((line, index) => (
          <div
            key={`${line.startTimeMs}-${index}`}
            ref={index === activeLineIndex ? activeLineRef : undefined}
          >
            <StageLine
              currentTimeMs={currentTimeMs}
              fontScale={fontScale}
              isActive={index === activeLineIndex}
              line={line}
              showRomanization={showRomanization}
              showTranslation={showTranslation}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function LyricWordText({
  currentTimeMs,
  word,
}: {
  currentTimeMs: number;
  word: LyricDisplayLine["words"][number];
}) {
  const characters = Array.from(word.text);
  const completedCharacters = Math.round(characters.length * getWordProgress(word, currentTimeMs));
  return (
    <span className="whitespace-pre-wrap">
      <span className="text-white">{characters.slice(0, completedCharacters).join("")}</span>
      <span className="text-white/30">{characters.slice(completedCharacters).join("")}</span>
    </span>
  );
}

function StageLine({
  currentTimeMs,
  fontScale,
  isActive,
  line,
  showRomanization,
  showTranslation,
}: {
  currentTimeMs: number;
  fontScale: number;
  isActive: boolean;
  line: LyricDisplayLine;
  showRomanization: boolean;
  showTranslation: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() =>
        window.dispatchEvent(new CustomEvent("player-seek", { detail: line.startTimeMs }))
      }
      className={cn(
        "block w-full px-2 py-3 text-left transition-[color,opacity,transform] duration-300",
        isActive ? "scale-[1.015]" : "opacity-35 hover:opacity-70",
      )}
      style={{ fontSize: `${fontScale}em` }}
    >
      <span
        className={cn(
          "block leading-tight font-semibold",
          isActive ? "text-white" : "text-white/75",
        )}
      >
        {isActive
          ? line.words.map((word, index) => (
              <LyricWordText
                key={`${word.startTimeMs}-${index}`}
                currentTimeMs={currentTimeMs}
                word={word}
              />
            ))
          : line.text}
      </span>
      {isActive && showTranslation && line.translation ? (
        <span className="mt-1 block text-[0.55em] font-medium text-white/60">
          {line.translation}
        </span>
      ) : null}
      {isActive && showRomanization && line.romanization ? (
        <span className="mt-1 block text-[0.48em] font-medium text-white/45">
          {line.romanization}
        </span>
      ) : null}
    </button>
  );
}
