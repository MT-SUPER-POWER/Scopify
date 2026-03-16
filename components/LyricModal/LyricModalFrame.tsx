"use client";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ PACKAGE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import React, { ReactNode, useMemo, useEffect, Component } from "react";
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
import dynamic from "next/dynamic";
import { parseLrc, parseYrc } from "@applemusic-like-lyrics/lyric";
import "@applemusic-like-lyrics/core/style.css";

import { cn, formatDuration } from "@/lib/utils";
// 🚨 引入上一轮优化的 useTimeStore，彻底分离高频时间更新
import { usePlayerStore, useUiStore } from "@/store";
import { SmoothSlider } from "@/components/SmoothSlider";
import { useTimeStore } from "@/store/module/time";

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

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ ERROR BOUNDARY ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class WebGLFallbackBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode; fallback: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: any) {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.warn("WebGL Background Render Failed. Falling back to CSS mode.", error.message);
  }

  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ SUB UI ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const CloseModalButton = ({ onLyricClose }: { onLyricClose: () => void }) => (
  <div className="absolute top-8 left-8 z-50">
    <button
      onClick={onLyricClose}
      className="p-2 lg:p-3 bg-black/20 hover:bg-white/10 text-white/80 hover:text-white rounded-full backdrop-blur-md transition-all duration-300"
    >
      <ChevronDown className="w-6 h-6 lg:w-7 lg:h-7" />
    </button>
  </div>
);

const CSSFallbackBackground = ({ coverUrl }: { coverUrl: string }) => {
  if (!coverUrl) return null;
  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none bg-[#0a0a0a]">
      <div
        className="absolute inset-0 opacity-60 transition-all duration-1000 ease-in-out"
        style={{
          backgroundImage: `url(${coverUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(80px) saturate(150%) brightness(0.8)',
          transform: 'scale(1.5) translateZ(0)',
        }}
      />
    </div>
  );
};

const ModalBackground = ({ coverUrl }: { coverUrl: string }) => {
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  if (!coverUrl) return null;
  return (
    <WebGLFallbackBoundary fallback={<CSSFallbackBackground coverUrl={coverUrl} />}>
      <div
        className="absolute inset-0 z-0 scale-[1.2] pointer-events-none transition-opacity duration-1000"
        style={{ filter: 'blur(16px)' }}
      >
        <BackgroundRender
          album={coverUrl}
          playing={isPlaying}
          hasLyric={true}
          renderScale={0.35}
          staticMode={true} // 保持静态模式，极大幅度节省性能
        />
      </div>
    </WebGLFallbackBoundary>
  );
};

const PlayerProgress = () => {
  // 🚨 改用纯净的时间 Store，拒绝触发大 Store 的渲染与序列化
  const currentTime = useTimeStore((s) => s.currentTime);
  const totalTime = useTimeStore((s) => s.totalTime);

  const progressPercent = totalTime > 0 ? (currentTime / totalTime) * 100 : 0;

  const handleSeek = (value: number) => {
    const newTimeMs = (value / 100) * totalTime;
    window.dispatchEvent(new CustomEvent('player-seek', { detail: newTimeMs }));
  };

  return (
    <div className="mt-6 flex flex-col gap-2 w-full">
      <SmoothSlider value={progressPercent} onChange={handleSeek} className="w-full" />
      <div className="flex items-center justify-between text-xs font-medium text-[#b3b3b3] tabular-nums">
        <span>{formatDuration(currentTime)}</span>
        <span>{formatDuration(totalTime)}</span>
      </div>
    </div>
  );
};

const PlayerControls = () => {
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const repeatMode = usePlayerStore((s) => s.repeatMode);
  const isShuffle = usePlayerStore((s) => s.isShuffle);

  const setIsPlaying = usePlayerStore((s) => s.setIsPlaying);
  const setRepeatMode = usePlayerStore((s) => s.setRepeatMode);
  const toggleShuffle = usePlayerStore((s) => s.toggleShuffle);
  const playNext = usePlayerStore((s) => s.playNext);
  const playPrev = usePlayerStore((s) => s.playPrev);

  return (
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
          {isPlaying ? <Pause className="w-8 h-8 lg:w-10 lg:h-10 fill-current" /> : <Play className="w-8 h-8 lg:w-10 lg:h-10 fill-current ml-1" />}
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
        {repeatMode === "one" ? <Repeat1 className="w-5 h-5 lg:w-6 lg:h-6 text-[#1ed760]" /> : <Repeat className={cn("w-5 h-5 lg:w-6 lg:h-6 transition-colors", repeatMode === "all" ? "text-[#1ed760]" : "text-[#b3b3b3] group-hover:text-white")} />}
        {repeatMode !== "off" && <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#1ed760] rounded-full" />}
      </button>
    </div>
  );
};

const AppleMusicLyricRenderer = () => {
  // 🚨 改用纯净时间 Store
  const currentTime = useTimeStore((s) => s.currentTime);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const lyric = usePlayerStore((s) => s.lyric);

  const yrcText = lyric?.yrc?.lyric?.trim() || "";
  const lrcText = lyric?.lrc?.lyric?.trim() || "";

  const parsedLyricLines = useMemo(() => {
    try {
      const parsed = yrcText ? parseYrc(yrcText) : lrcText ? parseLrc(lrcText) : [];
      return parsed.map((line, i, arr) => {
        const lineStart = line.words[0]?.startTime ?? 0;
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
          endTime: isFinite(lineEnd) ? lineEnd : (lineStart + 5000),
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
          enableBlur={false} // 保持关闭模糊，换取丝滑流畅
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

// 🚀 核心优化：将重量级 UI 及逻辑抽离为纯粹的内容组件
// 只有在打开时才会被渲染，关闭时连同里面的所有 Hook 和事件一并销毁！
const LyricModalContent = ({ onClose }: { onClose: () => void }) => {
  const currentSongDetail = usePlayerStore((s) => s.currentSongDetail);
  const coverUrl = currentSongDetail?.al?.picUrl || "";

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <motion.div
      initial={{ y: "100%", opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: "100%", opacity: 0 }}
      transition={{ type: "spring", damping: 25, stiffness: 200, mass: 0.8 }}
      className="fixed inset-0 z-100 flex flex-col text-white h-dvh bg-[#0a0a0a] overflow-hidden"
    >
      <ModalBackground coverUrl={coverUrl} />
      <div className="absolute inset-0 z-0 bg-black/40 pointer-events-none" />
      <CloseModalButton onLyricClose={onClose} />

      <div className="relative z-10 w-full h-full max-w-350 mx-auto px-8 lg:px-20 py-10 flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-24 overflow-y-auto lg:overflow-hidden">
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
          <PlayerProgress />
          <PlayerControls />
        </div>

        <div className="flex-1 min-h-[50vh] lg:min-h-0 w-full lg:h-[80%]">
          <AppleMusicLyricRenderer />
        </div>
      </div>
    </motion.div>
  );
};

// 真正的外部入口仅负责判定挂载与卸载动画
export default function LyricModalFrame({ isOpen, onClose, children }: LyricModalFrameProps) {
  return (
    <AnimatePresence>
      {/* 当 isOpen 为 false 时，LyricModalContent 将从内存中被物理抹除 */}
      {isOpen && <LyricModalContent onClose={onClose} />}
    </AnimatePresence>
  );
}
