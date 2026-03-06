"use client";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ PACKAGE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { useState, useRef } from "react";
import { ChevronDown, Play, Pause, SkipBack, SkipForward, Repeat, Menu, Volume2 } from "lucide-react";
import { useLyrics } from "./LyricModal/LyricsContext";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

const mockLyrics = [
  "如若你非我不嫁 彼此终必火化",
  "一生一世等一天需要代价",
  "谁都只得那双手靠拥抱亦难任你拥有",
  "要拥有必先懂失去怎接受",
  "曾沿着雪路浪游 为何为好事泪流",
  "谁能凭爱意要富士山私有",
  "何不把悲哀感觉假设是来自你虚构",
  "试管里找不到它染污眼眸",
  "前尘硬化像石头 随缘地抛下便逃走",
  "我绝不罕有 往街里绕过一周",
  "我便化乌有"
];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 小组件区 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// 头部关闭按钮
function LyricModalHeader() {
  const { closeLyrics } = useLyrics();
  return (
    <div className="absolute top-0 left-0 w-40 h-40 z-50 group">
      <button
        onClick={closeLyrics}
        className="absolute top-10 left-10 p-3 bg-black/30 hover:bg-black/50 text-white/90 hover:text-white rounded-full transition-all duration-300 opacity-0 group-hover:opacity-100 backdrop-blur-md shadow-lg transform group-hover:scale-105"
      >
        <ChevronDown className="w-8 h-8" />
      </button>
    </div>
  );
}

// 左侧信息区
function LyricModalLeft({ isPlaying, setIsPlaying }: { isPlaying: boolean; setIsPlaying: (b: boolean) => void }) {
  return (
    <div className="flex flex-col w-96 shrink-0 justify-center px-4">
      {/* 专辑封面 */}
      <div className="w-full aspect-square rounded-xl overflow-hidden shadow-2xl mb-10">
        <img
          src="https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=600&auto=format&fit=crop"
          alt="富士山下"
          className="w-full h-full object-cover"
        />
      </div>

      <ControlPanel isPlaying={isPlaying} setIsPlaying={setIsPlaying} />
    </div>
  );
}

function ControlPanel({ isPlaying, setIsPlaying }: { isPlaying: boolean; setIsPlaying: (b: boolean) => void }) {
  return (
    <>
      {/* 歌曲信息 (居中) */}
      <div className="text-center mb-8">
        <h1 className="text-[26px] font-bold mb-1.5 tracking-wide">富士山下</h1>
        <p className="text-[#A79C96] text-[15px] opacity-80">陈奕迅</p>
      </div>

      {/* 进度条 (上横条，下时间) */}
      <div className="mb-6 px-1">
        <div className="h-1.5 w-full bg-black/20 rounded-full cursor-pointer group mb-2">
          <div className="h-full bg-white/70 group-hover:bg-white rounded-full relative transition-colors w-[30%]"></div>
        </div>
        <div className="flex justify-between text-[11px] text-[#A79C96] font-medium tabular-nums opacity-70">
          <span>01:16</span>
          <span>04:19</span>
        </div>
      </div>

      {/* 播放控制区 */}
      <div className="flex items-center justify-between mb-8 px-2">
        <button className="text-[#A79C96] hover:text-white transition-colors opacity-70 hover:opacity-100">
          <Repeat className="w-4.5 h-4.5" />
        </button>
        <button className="text-white hover:opacity-80 transition-opacity">
          <SkipBack className="w-9 h-9 fill-current" />
        </button>
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="w-14 h-14 flex items-center justify-center rounded-full bg-black/20 hover:bg-black/30 transition-colors"
        >
          {isPlaying ? (
            <Pause className="w-6 h-6 fill-current" />
          ) : (
            <Play className="w-6 h-6 fill-current ml-1" />
          )}
        </button>
        <button className="text-white hover:opacity-80 transition-opacity">
          <SkipForward className="w-9 h-9 fill-current" />
        </button>
        <button className="text-[#A79C96] hover:text-white transition-colors opacity-70 hover:opacity-100">
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* 音量条 */}
      <div className="flex items-center gap-3 px-3 opacity-70 hover:opacity-100 transition-opacity">
        <Volume2 className="w-4 h-4 text-white" />
        <div className="h-1.5 w-full bg-black/20 rounded-full cursor-pointer">
          <div className="h-full bg-white rounded-full w-[60%]"></div>
        </div>
      </div>
    </>
  );
}

// 右侧歌词区
function LyricModalRight({ activeLineIndex, setActiveLineIndex, handleWheel }: {
  activeLineIndex: number;
  setActiveLineIndex: (idx: number) => void;
  handleWheel: (e: React.WheelEvent) => void;
}) {
  return (
    <div
      className="flex-1 flex flex-col justify-center overflow-hidden relative select-none"
      style={{
        maskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)'
      }}
      onWheel={handleWheel}
    >
      <motion.div
        className="absolute top-1/2 left-0 w-full"
        animate={{ y: -(activeLineIndex * 80 + 40) }}
        transition={{ type: "spring", stiffness: 120, damping: 20, mass: 0.8 }}
        style={{ perspective: '1200px' }}
      >
        {mockLyrics.map((line, index) => {
          const offset = index - activeLineIndex;
          const distance = Math.abs(offset);
          const isActive = offset === 0;
          const rotateX = offset * -20;
          const scaleAmount = isActive ? 1 : Math.max(0.65, 0.95 - distance * 0.05);
          const blurAmount = isActive ? 0 : distance * 1.5;
          const opacityAmount = isActive ? 1 : Math.max(0.05, 0.6 - distance * 0.15);
          return (
            <div
              key={index}
              className="h-20 flex items-center pr-8"
              onClick={() => setActiveLineIndex(index)}
            >
              <p
                className={cn(
                  `text-[32px] font-bold transition-all duration-300 ease-out cursor-pointer`,
                  `${isActive ? "text-white" : "text-[#A79C96] hover:text-white"}`
                )}
                style={{
                  transform: `rotateX(${rotateX}deg) scale(${scaleAmount})`,
                  filter: `blur(${blurAmount}px)`,
                  opacity: opacityAmount,
                  transformOrigin: "left center"
                }}
              >
                {line}
              </p>
            </div>
          );
        })}
      </motion.div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 主组件 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const LyricsModal = () => {
  const { isLyricsOpen } = useLyrics();
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeLineIndex, setActiveLineIndex] = useState(5);
  const accumulatedDelta = useRef(0);
  const lastScrollTime = useRef(0);

  const handleWheel = (e: React.WheelEvent) => {
    const now = Date.now();
    const threshold = 60; // 累计滚动的阈值
    const minInterval = 70; // 两次跳动之间的最小时间间隔 (ms)

    accumulatedDelta.current += e.deltaY;

    if (Math.abs(accumulatedDelta.current) >= threshold) {
      if (now - lastScrollTime.current > minInterval) {
        const steps = Math.sign(accumulatedDelta.current); // 每次只跳动 1 或 -1
        setActiveLineIndex(prev => {
          const newIndex = prev + steps;
          return Math.max(0, Math.min(newIndex, mockLyrics.length - 1));
        });
        lastScrollTime.current = now;
        accumulatedDelta.current = 0; // 触发后重置，确保下一次需要重新达到阈值
      }
    }

    // 如果长时间没滚动，重置累积值防止下次滚动反应过快
    clearTimeout((handleWheel as any).timer);
    (handleWheel as any).timer = setTimeout(() => {
      accumulatedDelta.current = 0;
    }, 150);
  };

  return (
    <AnimatePresence>
      {isLyricsOpen && (
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{
            type: "spring",
            damping: 25,
            stiffness: 200,
            mass: 0.8
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#372f28] text-white overflow-hidden"
        >
          <LyricModalHeader />

          {/* 响应式布局：大屏横向展示，小屏纵向展示 */}
          <div className="w-full h-[80vh] px-6 md:px-12 flex flex-col md:flex-row gap-8 md:gap-12 max-w-7xl mx-auto">

            {/* 大屏显示封面+控制区，小屏只显示控制区（封面隐藏） */}
            <div className="hidden momo_bg:flex w-96 shrink-0">
              <LyricModalLeft isPlaying={isPlaying} setIsPlaying={setIsPlaying} />
            </div>

            {/* 歌词区 - 始终显示 */}
            <LyricModalRight
              activeLineIndex={activeLineIndex}
              setActiveLineIndex={setActiveLineIndex}
              handleWheel={handleWheel}
            />

            {/* 小屏模式：控制区显示在底部 */}
            <div className="momo_bg:hidden w-full mt-auto px-24">
              <ControlPanel isPlaying={isPlaying} setIsPlaying={setIsPlaying} />
            </div>
          </div>

        </motion.div>
      )}
    </AnimatePresence>
  );
};
