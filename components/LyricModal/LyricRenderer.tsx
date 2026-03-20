"use client";

import { useMemo, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { parseLrc, parseYrc } from "@applemusic-like-lyrics/lyric";
import "@applemusic-like-lyrics/core/style.css";
import { usePlayerStore } from "@/store";
import { useTimeStore } from "@/store/module/time";

const LyricPlayer = dynamic(
  () => import("@applemusic-like-lyrics/react").then((mod) => mod.LyricPlayer),
  { ssr: false }
);

export const LyricRenderer = () => {
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const lyric = usePlayerStore((s) => s.lyric);

  const [currentTimeMs, setCurrentTimeMs] = useState(0);
  const lastUpdateRef = useRef(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const tick = (now: number) => {
      if (now - lastUpdateRef.current >= 100) {
        lastUpdateRef.current = now;
        setCurrentTimeMs(Math.floor(useTimeStore.getState().currentTime));
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const yrcText = lyric?.yrc?.lyric?.trim() || "";
  const lrcText = lyric?.lrc?.lyric?.trim() || "";

  const parsedLyricLines = useMemo(() => {
    try {
      const parsed = yrcText ? parseYrc(yrcText) : lrcText ? parseLrc(lrcText) : [];
      return parsed.map((line, i, arr) => {
        const lineStart = line.words[0]?.startTime ?? 0;
        const nextLineStart = arr[i + 1]?.words[0]?.startTime;
        const lineEnd =
          nextLineStart !== undefined && isFinite(nextLineStart)
            ? nextLineStart
            : isFinite(line.endTime)
            ? line.endTime
            : lineStart + 5000;

        return {
          words: line.words.map((w: any, wi: number, warr: any[]) => {
            const wordStart = w.startTime ?? lineStart;
            const nextWordStart = warr[wi + 1]?.startTime;
            let wordEnd =
              nextWordStart !== undefined && isFinite(nextWordStart) ? nextWordStart : lineEnd;
            if (!isFinite(wordEnd)) wordEnd = wordStart + 500;
            return {
              word: w.word,
              startTime: isFinite(wordStart) ? wordStart : 0,
              endTime: wordEnd,
              romanWord: "",
              obscene: false,
            };
          }),
          startTime: isFinite(lineStart) ? lineStart : 0,
          endTime: isFinite(lineEnd) ? lineEnd : lineStart + 5000,
          translatedLyric: "",
          romanLyric: "",
          isBG: false,
          isDuet: false,
        };
      });
    } catch (error) {
      console.error("Failed to parse lyrics:", error);
      return [];
    }
  }, [yrcText, lrcText]);

  return (
    <div
      className="w-full h-full relative overflow-hidden"
      style={{
        WebkitMaskImage:
          "linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)",
        maskImage:
          "linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)",
      }}
    >
      {parsedLyricLines.length === 0 ? (
        <div className="w-full h-full flex items-center justify-center text-white/60 text-lg lg:text-xl font-medium drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
          暂无歌词
        </div>
      ) : (
        <LyricPlayer
          className="w-full h-full font-[550]"
          lyricLines={parsedLyricLines}
          currentTime={currentTimeMs}
          playing={isPlaying}
          alignAnchor="center"
          alignPosition={0.5}
          enableBlur={false}
          enableScale={true}
          hidePassedLines={false}
          onLyricLineClick={(event: any) => {
            if (event?.line?.startTime) {
              window.dispatchEvent(
                new CustomEvent("player-seek", { detail: event.line.startTime })
              );
            }
          }}
        />
      )}
    </div>
  );
};
