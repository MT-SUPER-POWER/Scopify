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

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 核心优化点：高性能的高频时间接收器 (类似游戏引擎的 Tick Update)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  useEffect(() => {
    let animationFrameId: number;
    // 缓存最新时间，避免事件触发频率高于帧率时产生过多的不必要运算
    let latestTimeMs = 0;

    const onTimeUpdate = (e: Event) => {
      latestTimeMs = (e as CustomEvent<number>).detail;
    };

    // 将 React 状态更新对齐到屏幕刷新率 (通常 60Hz/144Hz)
    const renderLoop = () => {
      setCurrentTimeMs((prev) => (prev !== latestTimeMs ? latestTimeMs : prev));
      animationFrameId = requestAnimationFrame(renderLoop);
    };

    window.addEventListener("player-time", onTimeUpdate);
    animationFrameId = requestAnimationFrame(renderLoop);

    return () => {
      window.removeEventListener("player-time", onTimeUpdate);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);


  const yrcText = lyric?.yrc?.lyric?.trim() || "";
  const lrcText = lyric?.lrc?.lyric?.trim() || "";

  const parsedLyricLines = useMemo(() => {
    try {
      const parsed = yrcText ? parseYrc(yrcText) : lrcText ? parseLrc(lrcText) : [];
      return parsed.map((line: any, i: number, arr: any[]) => {
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
      {/* 预览沙盒中由于没有歌词数据强制显示 LyricPlayer，复制到项目中时此处逻辑不受影响 */}
      {false ? (
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
              // 点击歌词跳转播放进度
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
