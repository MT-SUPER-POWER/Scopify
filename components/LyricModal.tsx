"use client";

import React, { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLyrics } from "./MainLayout";
import ControlPanel from "./Playlist/ControlPanel";

// TODO: 使用 Apple-Music-like-lyric 重构

const mockLyrics = [
  "如若你非我不嫁 彼此终必火化",
  "一生一世等一天需要代价daskjdlaksjdlaskjdlkajsdaskdjas这就很长很长很长很长很长很长很长折行测试",
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

// 专辑封面 URL
const COVER_URL = "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=600&auto=format&fit=crop";

// 头部关闭按钮
function LyricModalHeader() {
  const { closeLyrics } = useLyrics();
  return (
    <div className={cn(
      "absolute top-0 left-0 w-full h-24 z-50 pointer-events-none flex items-start pt-6 pl-6 lg:pt-10 lg:pl-10",
      // 移除 hidden，使用透明度控制
      "opacity-0 transition-opacity duration-300 hover:opacity-100"
    )}>
      <button
        onClick={closeLyrics}
        className="pointer-events-auto p-2 lg:p-3 bg-black/20 hover:bg-black/40 text-white/80 hover:text-white rounded-full transition-all duration-300 backdrop-blur-md"
      >
        <ChevronDown className="w-6 h-6 lg:w-8 lg:h-8" />
      </button>
    </div>
  );
}

// 左侧信息区 (仅 PC 端显示)
function LyricModalLeft({ isPlaying, setIsPlaying }: { isPlaying: boolean; setIsPlaying: (b: boolean) => void }) {
  return (
    <div className="flex flex-col w-80 lg:w-96 shrink-0 justify-center px-4 relative z-10">
      <div className="w-full aspect-square rounded-2xl overflow-hidden shadow-2xl shadow-black/50 mb-10 bg-black/20 ring-1 ring-white/10">
        <img src={COVER_URL} alt="富士山下" className="w-full h-full object-cover" />
      </div>
      <ControlPanel isPlaying={isPlaying} setIsPlaying={setIsPlaying} isDesktop />
    </div>
  );
}

// 右侧歌词区
function Lyric({ activeLineIndex, setActiveLineIndex, handleWheel }: {
  activeLineIndex: number;
  setActiveLineIndex: (idx: number) => void;
  handleWheel: (e: React.WheelEvent) => void;
}) {
  const [offsetY, setOffsetY] = useState(0);
  const lineRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const updateOffset = () => {
      const activeEl = lineRefs.current[activeLineIndex];
      if (activeEl) {
        const top = activeEl.offsetTop;
        const height = activeEl.offsetHeight;
        setOffsetY(-(top + height / 2));
      }
    };
    updateOffset();
    window.addEventListener('resize', updateOffset);
    return () => window.removeEventListener('resize', updateOffset);
  }, [activeLineIndex]);

  return (
    <div
      className="flex-1 overflow-hidden select-none w-full h-full relative z-10"
      style={{
        maskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)'
      }}
      onWheel={handleWheel}
    >
      <motion.div
        // 移除了移动端固定的 padding 和偏置，让它在小屏幕彻底居中
        className="absolute top-1/2 w-full lg:left-8"
        animate={{ y: offsetY }}
        transition={{ type: "spring", stiffness: 120, damping: 20, mass: 0.8 }}
        style={{ perspective: '1200px' }}
      >
        {mockLyrics.map((line, index) => {
          const offset = index - activeLineIndex;
          const distance = Math.abs(offset);
          const isActive = offset === 0;
          const rotateX = offset * -15;
          const scaleAmount = isActive ? 1 : Math.max(0.75, 0.95 - distance * 0.05);
          const blurAmount = isActive ? 0 : distance * 1.2;
          const opacityAmount = isActive ? 1 : Math.max(0.1, 0.6 - distance * 0.15);

          return (
            <div
              key={index}
              ref={el => { lineRefs.current[index] = el; }}
              className={cn(
                "py-4 flex items-center justify-center lg:justify-start px-6 lg:px-0 lg:pr-4",
                "px-8 lg:px-12"
              )}
              onClick={() => setActiveLineIndex(index)}
              style={{ position: 'relative', zIndex: isActive ? 10 : 1 }}
            >
              <p
                className={cn(
                  `text-2xl lg:text-[32px] font-bold transition-all duration-300 ease-out`,
                  `cursor-pointer leading-snug wrap-break-word whitespace-normal drop-shadow-md`,
                  `text-center origin-center lg:text-left lg:origin-left`,
                  "w-full",
                  isActive ? "text-white" : "text-white/40 hover:text-white/80"
                )}
                style={{
                  transform: `rotateX(${rotateX}deg) scale(${scaleAmount})`,
                  filter: `blur(${blurAmount}px)`,
                  opacity: opacityAmount,
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

// 主组件
export default function LyricsModal() {
  const { isLyricsOpen } = useLyrics();
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeLineIndex, setActiveLineIndex] = useState(1);
  const accumulatedDelta = useRef(0);
  const lastScrollTime = useRef(0);
  const scrollTimer = useRef<NodeJS.Timeout | null>(null);

  const handleWheel = (e: React.WheelEvent) => {
    const now = Date.now();
    const threshold = 60;
    const minInterval = 70;

    accumulatedDelta.current += e.deltaY;

    if (Math.abs(accumulatedDelta.current) >= threshold) {
      if (now - lastScrollTime.current > minInterval) {
        const steps = Math.sign(accumulatedDelta.current);
        setActiveLineIndex(prev => Math.max(0, Math.min(prev + steps, mockLyrics.length - 1)));
        lastScrollTime.current = now;
        accumulatedDelta.current = 0;
      }
    }

    if (scrollTimer.current) clearTimeout(scrollTimer.current);
    scrollTimer.current = setTimeout(() => { accumulatedDelta.current = 0; }, 150);
  };

  return (
    <AnimatePresence>
      {isLyricsOpen && (
        <motion.div
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 200, mass: 0.8 }}
          className="fixed inset-0 z-50 flex items-center justify-center text-white overflow-hidden h-dvh bg-[#1a1a1a]"
        >
          <div
            className="absolute inset-0 z-0 bg-cover bg-center blur-[80px] opacity-40 scale-125 pointer-events-none"
            style={{ backgroundImage: `url(${COVER_URL})` }}
          />

          {/* 渲染层 */}
          <div className="absolute inset-0 z-0 bg-black/40 pointer-events-none" />

          <LyricModalHeader />

          <div className="w-full h-full pt-20 pb-6 lg:px-12 flex flex-col lg:flex-row gap-6 lg:gap-12 max-w-7xl mx-auto relative z-10">
            <div className="hidden lg:flex shrink-0">
              <LyricModalLeft isPlaying={isPlaying} setIsPlaying={setIsPlaying} />
            </div>

            <Lyric
              activeLineIndex={activeLineIndex}
              setActiveLineIndex={setActiveLineIndex}
              handleWheel={handleWheel}
            />

            <div className="lg:hidden w-full mt-auto px-6 pb-4 pt-4">
              <ControlPanel isPlaying={isPlaying} setIsPlaying={setIsPlaying} />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
