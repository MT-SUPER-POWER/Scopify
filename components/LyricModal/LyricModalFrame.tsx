"use client";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ PACKAGE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import React, { ReactNode, useMemo, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Repeat,
  Repeat1,
  Shuffle,
} from "lucide-react";
import { cn, formatDuration } from "@/lib/utils";
import { usePlayerStore } from "@/store";
import dynamic from "next/dynamic";
import { SmoothSlider } from "@/components/SmoothSlider";
import { parseLrc, parseYrc } from "@applemusic-like-lyrics/lyric";
import "@applemusic-like-lyrics/core/style.css";

// 动态导入 AMLL 内部组件 (禁用 SSR)
const LyricPlayer = dynamic(
  () => import("@applemusic-like-lyrics/react").then((mod) => mod.LyricPlayer),
  { ssr: false }
);

const BackgroundRender = dynamic(
  () => import("@applemusic-like-lyrics/react").then((mod) => mod.BackgroundRender),
  { ssr: false }
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ PROPS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface LyricModalFrameProps {
  isOpen: boolean;
  onClose: () => void;
  children?: ReactNode;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ SUB UI ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const CloseModalButton = ({ onLyricClose }: { onLyricClose: () => void }) => {
  return (
    <div className="absolute top-8 left-8 z-50">
      <button
        onClick={onLyricClose}
        className="p-2 lg:p-3 bg-black/20 hover:bg-white/10 text-white/80 hover:text-white rounded-full backdrop-blur-md transition-all duration-300"
      >
        <ChevronDown className="w-6 h-6 lg:w-7 lg:h-7" />
      </button>
    </div>
  );
};

// 歌词渲染器
const AppleMusicLyricRenderer = () => {
  const { currentTime, isPlaying, lyric } = usePlayerStore();
  const yrcText = lyric?.yrc?.lyric?.trim() || "";
  const lrcText = lyric?.lrc?.lyric?.trim() || "";

  // console.log(`yrc = ${yrcText} and lrc = ${lrcText}`);

  const parsedLyricLines = useMemo(() => {
    try {
      const parsed = yrcText ? parseYrc(yrcText) : lrcText ? parseLrc(lrcText) : [];
      return parsed.map((line, i, arr) => {
        const lineStart = line.words[0]?.startTime ?? 0;
        // NOTE: 避免出现 Infinity，使用一个合理的最大值
        const nextLineStart = arr[i + 1]?.words[0]?.startTime;
        const lineEnd = (nextLineStart !== undefined && isFinite(nextLineStart))
          ? nextLineStart
          : (isFinite(line.endTime) ? line.endTime : lineStart + 5000);

        return {
          words: line.words.map((w: any, wi: number, warr: any[]) => {
            const wordStart = w.startTime ?? lineStart;
            const nextWordStart = warr[wi + 1]?.startTime;
            let wordEnd = (nextWordStart !== undefined && isFinite(nextWordStart))
              ? nextWordStart
              : lineEnd;

            // 确保 wordEnd 是有限数值
            if (!isFinite(wordEnd)) {
              wordEnd = wordStart + 500;
            }

            return {
              word: w.word,
              startTime: isFinite(wordStart) ? wordStart : 0,
              endTime: wordEnd,
              romanWord: "",
              obscene: false,
            };
          }),
          startTime: isFinite(lineStart) ? lineStart : 0,
          endTime: isFinite(lineEnd) ? lineEnd : (lineStart + 5000),
          // NOTE: 这里接入翻译后的歌词
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

  const currentTimeMs = Math.floor((currentTime || 0));

  return (
    <div
      className="w-full h-full relative overflow-hidden"
      style={{
        WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)",
        maskImage: "linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)",
      } as React.CSSProperties}
    >
      {/* 区分三种状态：无歌词、占位假歌词、正常歌词 */}
      {parsedLyricLines.length === 0 ? (
        <div className="w-full h-full flex items-center justify-center text-white/60 text-lg lg:text-xl font-medium drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
          暂无歌词
        </div>
      ) : (
        <LyricPlayer
          className="w-full h-full font-[550]" // 确保有默认的字体粗细
          lyricLines={parsedLyricLines}
          currentTime={currentTimeMs}
          playing={isPlaying}
          alignAnchor="center"
          alignPosition={0.5}
          enableBlur={true} // 必须开启 Blur！这是 Apple Music 效果的灵魂
          enableScale={true}
          hidePassedLines={false}
          onLyricLineClick={(event: any) => {
            if (event?.line?.startTime) {
              window.dispatchEvent(new CustomEvent('player-seek', { detail: event.line.startTime }));
            }
          }}
        />
      )}
    </div>
  );
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ MAIN UI ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export default function LyricModalFrame({ isOpen, onClose, children }: LyricModalFrameProps) {
  const {
    currentSongDetail, isPlaying, currentTime, totalTime, repeatMode, isShuffle,
    setIsPlaying, setRepeatMode, toggleShuffle, playNext, playPrev
  } = usePlayerStore();


  // console.log("Total Time = ", totalTime, "Current Time =", currentTime);

  const coverUrl = currentSongDetail?.al?.picUrl || "";

  const progressPercent = totalTime > 0 ? (currentTime / totalTime) * 100 : 0;

  const handleSeek = (value: number) => {
    const newTimeMs = (value / 100) * totalTime;
    window.dispatchEvent(new CustomEvent('player-seek', { detail: newTimeMs }));
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 200, mass: 0.8 }}
          className="fixed inset-0 z-100 flex flex-col text-white h-dvh bg-[#0a0a0a] overflow-hidden"
        >
          {/* 背景层修复：去掉了破坏 Canvas 的 blur-3xl 和 opacity-40 */}
          <div className="absolute inset-0 z-0 scale-110 pointer-events-none transition-opacity duration-1000">
            {coverUrl && (
              <BackgroundRender album={coverUrl} playing={isPlaying} hasLyric={true} />
            )}
          </div>
          {/* 只保留一个轻微的黑色遮罩，确保白色歌词和控制条的对比度可读性 */}
          <div className="absolute inset-0 z-0 bg-black/40 pointer-events-none" />

          <CloseModalButton onLyricClose={onClose} />

          {/* 核心内容区 */}
          <div className="relative z-10 w-full h-full max-w-350 mx-auto px-8 lg:px-20 py-10 flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-24 overflow-y-auto lg:overflow-hidden">

            {/* 左侧：封面、信息与控制区 */}
            <div className="shrink-0 w-full lg:w-[45%] max-w-120 flex flex-col mt-16 lg:mt-0">
              <div className="w-full aspect-square rounded-[2rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] bg-white/5 border border-white/5">
                {coverUrl ? (
                  <img src={coverUrl} alt="Cover" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-[#1a1a1a]" />
                )}
              </div>

              <div className="mt-8 lg:mt-10 flex flex-col w-full text-left">
                <h2 className="text-2xl lg:text-3xl font-bold truncate text-white tracking-tight">
                  {currentSongDetail?.name || "未知歌曲"}
                </h2>
                <p className="text-base lg:text-lg font-medium text-[#b3b3b3] mt-1.5 truncate">
                  {currentSongDetail?.ar?.map((a: any) => a.name).join(", ") || "未知歌手"}
                </p>
              </div>

              {/* 进度条 */}
              <div className="mt-6 flex flex-col gap-2 w-full">
                <SmoothSlider value={progressPercent} onChange={handleSeek} className="w-full" />
                <div className="flex items-center justify-between text-xs font-medium text-[#b3b3b3] tabular-nums">
                  <span>{formatDuration(currentTime)}</span>
                  <span>{formatDuration(totalTime)}</span>
                </div>
              </div>

              {/* 控制区 */}
              <div className="mt-6 flex items-center justify-between w-full">
                <button onClick={toggleShuffle} className="p-2 relative group">
                  <Shuffle className={cn("w-5 h-5 lg:w-6 lg:h-6 transition-colors", isShuffle ? "text-[#1ed760]" : "text-[#b3b3b3] group-hover:text-white")} />
                  {isShuffle && <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#1ed760] rounded-full" />}
                </button>

                <div className="flex items-center gap-6 lg:gap-8">
                  <button onClick={playPrev} className="text-[#b3b3b3] hover:text-white transition-colors active:scale-95">
                    <SkipBack className="w-8 h-8 lg:w-9 lg:h-9 fill-current" />
                  </button>

                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="w-16 h-16 lg:w-20 lg:h-20 flex items-center justify-center rounded-full bg-white text-black hover:scale-105 active:scale-95 transition-all shadow-xl"
                  >
                    {isPlaying ? (
                      <Pause className="w-8 h-8 lg:w-10 lg:h-10 fill-current" />
                    ) : (
                      <Play className="w-8 h-8 lg:w-10 lg:h-10 fill-current ml-1" />
                    )}
                  </button>

                  <button onClick={playNext} className="text-[#b3b3b3] hover:text-white transition-colors active:scale-95">
                    <SkipForward className="w-8 h-8 lg:w-9 lg:h-9 fill-current" />
                  </button>
                </div>

                <button
                  onClick={() => {
                    const modes = ["off", "all", "one"] as const;
                    const next = modes[(modes.indexOf(repeatMode) + 1) % modes.length];
                    setRepeatMode(next);
                  }}
                  className="p-2 relative group"
                >
                  {repeatMode === "one" ? (
                    <Repeat1 className="w-5 h-5 lg:w-6 lg:h-6 text-[#1ed760]" />
                  ) : (
                    <Repeat className={cn("w-5 h-5 lg:w-6 lg:h-6 transition-colors", repeatMode === "all" ? "text-[#1ed760]" : "text-[#b3b3b3] group-hover:text-white")} />
                  )}
                  {repeatMode !== "off" && <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#1ed760] rounded-full" />}
                </button>
              </div>
            </div>

            {/* 右侧：歌词滚动区 */}
            <div className="flex-1 min-h-[50vh] lg:min-h-0 w-full lg:h-[80%]">
              <AppleMusicLyricRenderer />
            </div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
