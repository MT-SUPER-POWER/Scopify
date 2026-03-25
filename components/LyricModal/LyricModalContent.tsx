"use client";

import { useState, useEffect } from "react";
import { useRef } from "react";
import { Maximize, Minimize, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePlayerStore } from "@/store";
import { ModalBackground } from "./ModalBackground";
import { LyricRenderer } from "./LyricRenderer";
import Image from "next/image";
import { PlayerBar } from '../PlayerBar';
import { motion } from "motion/react";
import { FaCompactDisc, FaUser } from "react-icons/fa6";

export const LyricModalContent = ({ onClose }: {
  onClose?: () => void;
}) => {
  const currentSongDetail = usePlayerStore((s) => s.currentSongDetail);
  const coverUrl = currentSongDetail?.al?.picUrl || "";

  const [isClosing, setIsClosing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // 检测 F11 浏览器全屏（非 requestFullscreen）
  useEffect(() => {
    const checkFullScreen = () => {
      // 通过窗口尺寸和屏幕尺寸判断是否全屏
      const isBrowserFullScreen = window.innerHeight === screen.height &&
        window.innerWidth === screen.width && !document.fullscreenElement;
      setIsFullscreen(!!document.fullscreenElement || isBrowserFullScreen);
    };
    window.addEventListener("resize", checkFullScreen);
    document.addEventListener("fullscreenchange", checkFullScreen);
    checkFullScreen();
    return () => {
      window.removeEventListener("resize", checkFullScreen);
      document.removeEventListener("fullscreenchange", checkFullScreen);
    };
  }, []);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => { onClose?.(); }, 300);
  };

  // 自动隐藏头部和底部
  const [isBarVisible, setIsBarVisible] = useState(true);
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleMouseMove = () => {
      setIsBarVisible(true);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      hideTimerRef.current = setTimeout(() => setIsBarVisible(false), 3000);
    };
    window.addEventListener("mousemove", handleMouseMove);
    // 初始计时器
    hideTimerRef.current = setTimeout(() => setIsBarVisible(false), 3000);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, []);
  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen().catch(console.error);
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen().catch(console.error);
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (document.fullscreenElement) {
          setIsFullscreen(false);
        } else {
          handleClose();
        }
      }
    };

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  return (
    <div
      className={cn(
        "fixed inset-0 z-100 flex flex-col text-white h-dvh overflow-hidden bg-black",
        isClosing ? "animate-modal-exit" : "animate-modal-enter"
      )}
    >
      <ModalBackground coverUrl={coverUrl} />

      {/* 顶部控制栏 */}
      <motion.div
        animate={{ opacity: isBarVisible ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        className="absolute top-0 left-0 right-0 z-50 flex justify-end p-4 gap-3"
      >
        <button
          onClick={toggleFullscreen}
          className="p-2.5 rounded-full backdrop-blur-md text-white/70 hover:text-white
          hover:bg-black/40 transition-all duration-200"
        >
          {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
        </button>
        <button
          onClick={handleClose}
          className="p-2.5 rounded-full backdrop-blur-md text-white/70 hover:text-white
          hover:bg-black/40 transition-all duration-200"
        >
          <ChevronDown className="w-5 h-5" />
        </button>
      </motion.div>

      {/* 主要内容区域 */}
      <div className="flex-1 flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-16 px-6 lg:px-16 py-20
        max-w-7xl mx-auto w-full relative z-10">

        {/* 左侧：封面和歌曲信息 */}
        <div className="flex flex-col items-center lg:items-start gap-6 w-full lg:w-[40%] max-w-md">
          {/* 封面 */}
          <div className="relative w-full aspect-square max-w-[320px] lg:max-w-100 group">
            <div className="absolute inset-0 bg-linear-to-br from-white/10 to-transparent rounded-3xl blur-xl opacity-50 group-hover:opacity-70 transition-opacity" />
            <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,0.6)] ring-1 ring-white/10">
              {coverUrl ? (
                <Image
                  fill
                  src={coverUrl}
                  alt="Cover"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  draggable={false}
                  priority
                />
              ) : (
                <div className="w-full h-full bg-zinc-800/50 flex items-center justify-center">
                  <FaCompactDisc className="w-20 h-20 text-white/20" />
                </div>
              )}
            </div>
          </div>

          {/* 歌曲信息 */}
          <div className="flex flex-col items-center lg:items-start gap-2 w-full px-2">
            <h1 className="text-2xl lg:text-3xl font-bold text-white text-center lg:text-left leading-tight line-clamp-2">
              {currentSongDetail?.name || "Unknown Song"}
            </h1>

            <div className="flex flex-col gap-1.5 text-white/60 text-sm lg:text-base">
              <div className="flex items-center gap-2 justify-center lg:justify-start">
                <FaUser className="w-4 h-4 shrink-0" />
                <span className="truncate max-w-70">
                  {currentSongDetail?.ar?.map((a: any) => a.name).join(", ") || "Unknown Artist"}
                </span>
              </div>
              <div className="flex items-center gap-2 justify-center lg:justify-start">
                <FaCompactDisc className="w-4 h-4 shrink-0" />
                <span className="truncate max-w-70">
                  {currentSongDetail?.al?.name || "Unknown Album"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 右侧：歌词区域 */}
        <div className="flex-1 w-full lg:w-[55%] h-[50vh] lg:h-[70vh] flex flex-col">
          <div className="relative flex-1 rounded-3xl backdrop-blur-sm overflow-hidden">
            {/* 歌词渲染器 */}
            <div className="absolute inset-0 p-6 lg:p-8">
              <LyricRenderer />
            </div>
          </div>
        </div>
      </div>

      {/* 底部播放控制 */}
      <motion.div
        animate={{ opacity: isBarVisible ? 0.7 : 0 }}
        transition={{ duration: 0.3 }}
      >
        <PlayerBar
          className="bg-transparent"
          bgClass="bg-transparent"
          onCloseLyricModal={handleClose}
        />
      </motion.div>
    </div>
  );
};
