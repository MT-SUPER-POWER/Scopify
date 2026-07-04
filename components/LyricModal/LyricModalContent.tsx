"use client";

import { ChevronDown, Maximize, Minimize } from "lucide-react";
import { motion } from "motion/react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { FaCompactDisc, FaUser } from "react-icons/fa6";
import { cn } from "@/lib/utils";
import { usePlayerStore } from "@/store";
import { useI18n } from "@/store/module/i18n";
import { PlayerBar } from "../PlayerBar";
import { LyricRenderer } from "./LyricRenderer";
import { ModalBackground } from "./ModalBackground";

export const LyricModalContent = ({ onClose }: { onClose?: () => void }) => {
  const { t } = useI18n();
  const currentSongDetail = usePlayerStore((s) => s.currentSongDetail);
  const coverUrl = currentSongDetail?.al?.picUrl || "";

  const [isClosing, setIsClosing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // 检测 F11 浏览器全屏（非 requestFullscreen）
  useEffect(() => {
    const checkFullScreen = () => {
      // 通过窗口尺寸和屏幕尺寸判断是否全屏
      const isBrowserFullScreen =
        window.innerHeight === screen.height &&
        window.innerWidth === screen.width &&
        !document.fullscreenElement;
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

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      onClose?.();
    }, 300);
  }, [onClose]);

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
  }, [handleClose]);

  return (
    <div
      className={cn(
        "fixed inset-0 z-100 flex h-dvh flex-col overflow-hidden bg-black text-white",
        isClosing ? "animate-modal-exit" : "animate-modal-enter",
      )}
    >
      <ModalBackground coverUrl={coverUrl} />

      {/* 顶部控制栏 */}
      <motion.div
        animate={{ opacity: isBarVisible ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        className="absolute top-0 right-0 left-0 z-50 flex justify-end gap-3 p-4"
      >
        <button
          type="button"
          onClick={toggleFullscreen}
          className="rounded-full p-2.5 text-white/70 backdrop-blur-md transition-all duration-200 hover:bg-black/40 hover:text-white"
        >
          {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
        </button>
        <button
          type="button"
          onClick={handleClose}
          className="rounded-full p-2.5 text-white/70 backdrop-blur-md transition-all duration-200 hover:bg-black/40 hover:text-white"
        >
          <ChevronDown className="h-5 w-5" />
        </button>
      </motion.div>

      {/* 主要内容区域 */}
      <div className="relative z-10 mx-auto flex min-h-0 w-full max-w-[min(100rem,100vw)] flex-1 flex-col items-center justify-center gap-4 overflow-hidden px-4 pt-16 pb-3 sm:px-6 lg:flex-row lg:gap-[clamp(2rem,5vw,4rem)] lg:px-14 lg:pt-14 lg:pb-4">
        {/* 左侧：封面和歌曲信息 */}
        <div className="flex min-h-0 w-full flex-col items-center justify-center gap-3 lg:w-[38%] lg:items-start lg:gap-4">
          {/* 封面 */}
          <div className="group relative aspect-square w-[min(68vw,42dvh,320px)] shrink-0 lg:w-[min(30vw,52dvh,380px)]">
            <div className="absolute inset-0 rounded-3xl bg-linear-to-br from-white/10 to-transparent opacity-50 blur-xl transition-opacity group-hover:opacity-70" />
            <div className="relative h-full w-full overflow-hidden rounded-2xl shadow-[0_32px_80px_rgba(0,0,0,0.6)] ring-1 ring-white/10">
              {coverUrl ? (
                <Image
                  fill
                  src={coverUrl}
                  alt={t("album.coverAlt")}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  draggable={false}
                  priority
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-zinc-800/50">
                  <FaCompactDisc className="h-20 w-20 text-white/20" />
                </div>
              )}
            </div>
          </div>

          {/* 歌曲信息 */}
          <div className="flex w-full max-w-[min(68vw,42dvh,320px)] shrink-0 flex-col items-center gap-2 px-2 lg:max-w-[min(30vw,52dvh,380px)] lg:items-start">
            <h1 className="line-clamp-2 text-center text-xl leading-tight font-bold text-white lg:text-left lg:text-[clamp(1.35rem,2.1vw,1.875rem)]">
              {currentSongDetail?.name || t("common.meta.unknownSong")}
            </h1>

            <div className="flex flex-col gap-1.5 text-sm text-white/60 lg:text-[clamp(0.8rem,1vw,1rem)]">
              <div className="flex items-center justify-center gap-2 lg:justify-start">
                <FaUser className="h-4 w-4 shrink-0" />
                <span className="max-w-full truncate">
                  {currentSongDetail?.ar?.map((a: any) => a.name).join(", ") ||
                    t("common.meta.unknownArtist")}
                </span>
              </div>
              <div className="flex items-center justify-center gap-2 lg:justify-start">
                <FaCompactDisc className="h-4 w-4 shrink-0" />
                <span className="max-w-full truncate">
                  {currentSongDetail?.al?.name || t("common.meta.unknownAlbum")}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 右侧：歌词区域 */}
        <div className="flex h-[min(38dvh,18rem)] min-h-0 w-full flex-1 flex-col lg:h-full lg:w-[56%]">
          <div className="relative flex-1 overflow-hidden rounded-3xl backdrop-blur-sm">
            {/* 歌词渲染器 */}
            <div className="absolute inset-0 p-4 lg:p-8">
              <LyricRenderer />
            </div>
          </div>
        </div>
      </div>

      {/* 底部播放控制 */}
      <motion.div
        animate={{ opacity: isBarVisible ? 0.7 : 0 }}
        transition={{ duration: 0.3 }}
        className="relative z-20 shrink-0"
      >
        <PlayerBar
          className="bg-transparent"
          bgClass="bg-transparent"
          onCloseLyricModal={handleClose}
          variant="lyric-modal"
        />
      </motion.div>
    </div>
  );
};
