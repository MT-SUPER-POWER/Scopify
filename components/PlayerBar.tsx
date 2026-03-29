"use client";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ PACKAGE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { useState, useEffect, useCallback } from "react";
import {
  Play, Pause, SkipBack, SkipForward, Repeat, Repeat1, Shuffle,
  Mic2, MonitorSpeaker, Heart, Expand, MinimizeIcon,
  ChevronDown, ChevronUp,
} from "lucide-react";
import { FaRegCommentDots } from "react-icons/fa6";
import { useUiStore } from "@/store/module/ui";
import { VolumeControl } from "@/components/VolumeControl";
import { QueuePopover } from "@/components/QueuePopover";
import { cn, IS_ELECTRON } from "@/lib/utils";
import { usePlayerStore, useUserStore } from "@/store";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import { PlayerProgressBar } from './PlayBar/ProgressBar';
import { Skeleton } from "./ui/skeleton";
import { toast } from "sonner";
import { likeSong } from "@/lib/api/playlist";
import { useSmartRouter } from "@/lib/hooks/useSmartRouter";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ UTILS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const Maximized = (isElectron: boolean) => {
  if (isElectron) window.electronAPI?.enterFullScreen();
  else if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen();
};

const Minimize = (isElectron: boolean) => {
  if (isElectron) window.electronAPI?.exitFullScreen();
  else if (document.fullscreenElement) document.exitFullscreen();
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ UI ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const PlayerBar = ({
  className,
  onCloseLyricModal,
  style,
  bgClass,
}: {
  className?: string;
  onCloseLyricModal?: () => void;
  style?: React.CSSProperties;
  bgClass?: string;
}
) => {
  const isElectron = IS_ELECTRON;
  const isLyricsOpen = useUiStore(s => s.isLyricsOpen);
  const toggleLyrics = useUiStore(s => s.toggleLyrics);
  const [isMaximized, setIsMaximized] = useState(false);
  const openLyrics = () => useUiStore.getState().setIsLyricsOpen(true);
  const closeLyrics = () => useUiStore.getState().setIsLyricsOpen(false);
  const smartRouter = useSmartRouter();

  // 检测 F11 浏览器全屏（非 requestFullscreen）
  useEffect(() => {
    const checkFullScreen = () => {
      // 通过窗口尺寸和屏幕尺寸判断是否全屏
      const isBrowserFullScreen = window.innerHeight === screen.height &&
        window.innerWidth === screen.width && !document.fullscreenElement;
      setIsMaximized(!!document.fullscreenElement || isBrowserFullScreen);
    };
    window.addEventListener("resize", checkFullScreen);
    document.addEventListener("fullscreenchange", checkFullScreen);
    checkFullScreen();
    return () => {
      window.removeEventListener("resize", checkFullScreen);
      document.removeEventListener("fullscreenchange", checkFullScreen);
    };
  }, []);


  // Zustand Stores
  const volume = usePlayerStore(s => s.volume);
  const isPlaying = usePlayerStore(s => s.isPlaying);
  const currentSong = usePlayerStore(s => s.currentSongDetail);
  const repeatMode = usePlayerStore(s => s.repeatMode);
  const isShuffle = usePlayerStore(s => s.isShuffle);
  const setIsPlaying = usePlayerStore(s => s.setIsPlaying);
  const setRepeatMode = usePlayerStore(s => s.setRepeatMode);
  const toggleShuffle = usePlayerStore(s => s.toggleShuffle);
  const playNext = usePlayerStore(s => s.playNext);
  const playPrev = usePlayerStore(s => s.playPrev);

  const likelist = useUserStore((s) => s.likeListIDs) || [];
  const isLiked = Array.isArray(likelist) ? likelist.includes(currentSong?.id ?? -1) : false;
  const isLyricOpen = useUiStore((s) => s.isLyricsOpen);

  // 切换播放模式
  const cycleRepeat = () => {
    const modes = ["off", "all", "one"] as const;
    const next = modes[(modes.indexOf(repeatMode) + 1) % modes.length];
    setRepeatMode(next);
  };

  const toggleLike = useCallback(async (next: boolean) => {
    try {
      await likeSong(currentSong?.id as number, next);
      useUserStore.getState().libraryUpdateTrigger += 1;  // 触发喜欢列表更新
      const store = useUserStore.getState();
      const cur = Array.isArray(store.likeListIDs) ? store.likeListIDs.map((id) => Number(id)) : [];
      const idNum = Number(currentSong?.id);
      const nextList: number[] = next ? [...cur, idNum] : cur.filter((id) => id !== idNum);
      store.setLikeListIDs(nextList);
      toast.success(next ? "Added to Likes" : "Removed from Likes");
    } catch (error) {
      console.log("Error toggling like status:", error);
    }
  }, [currentSong]);

  return (
    <div
      className={cn(
        "h-17 lg:h-20 w-full flex items-center justify-between z-20 transition-all ease-linear duration-300",
        bgClass || "bg-black",
        className
      )}
      style={style}
    >
      <div className="h-17 lg:h-20 w-full flex px-4 items-center justify-between z-20 transition-all ease-linear duration-300">

        {/* ================= Left: Song Info ================= */}
        <div className="flex items-center gap-3 lg:gap-4 min-w-0 flex-1 lg:flex-3">
          <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-md overflow-hidden relative group cursor-pointer shadow-[0_4px_12px_rgba(0,0,0,0.5)] bg-zinc-800 shrink-0">
            {currentSong?.al?.picUrl ? (
              <Image
                width={56} height={56}
                src={currentSong.al.picUrl || currentSong.al.coverUrl || ""}
                alt={currentSong.al.name}
                className="w-full h-full object-cover"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
              />
            ) : (
              <Skeleton className="w-full h-full" />
            )}
            <div
              onClick={openLyrics}
              className="absolute top-[25%] left-[25%] opacity-0 group-hover:opacity-100 bg-black/70 rounded-full p-1 transition-opacity backdrop-blur-sm hover:scale-105 hover:bg-black/80 flex items-center justify-center">
              {isLyricOpen ? (
                <button onClick={(e) => {
                  e.stopPropagation();
                  if (onCloseLyricModal) onCloseLyricModal();
                  else closeLyrics();
                }} >
                  <ChevronDown className="w-5 h-5 text-white" />
                </button>
              ) : (
                <button onClick={(e) => { e.stopPropagation(); openLyrics(); }} >
                  <ChevronUp className="w-5 h-5 text-white" />
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-col justify-center min-w-0 flex-1 max-w-25 lg:max-w-35">
            {currentSong ? (
              <>
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onCloseLyricModal) onCloseLyricModal();
                    else closeLyrics();
                  }}
                  className="text-sm text-white hover:underline cursor-pointer truncate font-medium">
                  {currentSong.name}
                </span>
                <span className="text-[11px] text-[#b3b3b3] mt-0.5 font-normal truncate cursor-pointer">
                  {currentSong?.ar?.slice(0, 2).map((a, idx, arr) => (
                    <span
                      key={a.id}
                      onClick={e => {
                        e.stopPropagation();
                        if (useUiStore.getState().isLyricsOpen) onCloseLyricModal?.();
                        smartRouter.push(`/artist?id=${a.id}`);
                      }}
                      title={`/artist?id=${a.id}`}
                      className="hover:underline hover:text-white"
                      style={{ display: "inline" }}
                    >
                      {a.name}{idx < arr.length - 1 ? ', ' : ''}
                    </span>
                  ))}
                </span>
              </>
            ) : (
              <div className="space-y-1.5">
                <div className="h-3 w-24 rounded-full bg-white/10" />
                <div className="h-2.5 w-16 rounded-full bg-white/10" />
              </div>
            )}
          </div>

          <div className="hidden sm:flex items-center gap-3">
            <button title="Like"
              onClick={() => toggleLike(!isLiked)}
            >
              <Heart className={cn("w-4 h-4 lg:w-5 lg:h-5 text-[#b3b3b3] hover:text-white cursor-pointer", isLiked && "fill-[#1ed760] text-[#1ed760]")} />
            </button>
            <Link href={currentSong?.id ? `/comment?songId=${currentSong.id}` : "#"} onClick={(e) => !currentSong?.id && e.preventDefault()}>
              <FaRegCommentDots className="w-4 h-4 lg:w-5 lg:h-5 text-[#b3b3b3] hover:text-white cursor-pointer ml-1" />
            </Link>
          </div>
        </div>

        {/* ================= Center: Controls ================= */}
        <div className="flex flex-col items-center justify-center flex-2 lg:flex-4 gap-1.5 min-w-0">
          <div className="flex items-center gap-4 lg:gap-5 mt-1">
            <button
              onClick={toggleShuffle}
              className={cn("hidden sm:block transition-colors relative", isShuffle ? "text-[#1ed760]" : "text-[#b3b3b3] hover:text-white", "after:content-[''] after:absolute after:-bottom-1.5 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:bg-[#1ed760] after:rounded-full", isShuffle ? "after:opacity-100" : "after:opacity-0")}
            >
              <Shuffle className="w-4 h-4 lg:w-5 lg:h-5" />
            </button>
            <button onClick={() => playPrev()} className="text-[#b3b3b3] hover:text-white transition-colors">
              <SkipBack className="w-4 h-4 lg:w-5 lg:h-5 fill-current" />
            </button>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              disabled={!currentSong}
              className="w-9 h-9 lg:w-10 lg:h-10 flex items-center justify-center rounded-full bg-white
              text-black hover:scale-105 transition-all hover:bg-gray-200 active:scale-95 disabled:opacity-40"
            >
              {isPlaying ? <Pause className="w-4 h-4 lg:w-5 lg:h-5 fill-current" /> : <Play className="w-4 h-4 lg:w-5 lg:h-5 fill-current" />}
            </button>
            <button onClick={() => playNext()} className="text-[#b3b3b3] hover:text-white transition-colors">
              <SkipForward className="w-4 h-4 lg:w-5 lg:h-5 fill-current" />
            </button>
            <button
              onClick={cycleRepeat}
              className={cn("hidden sm:block transition-colors relative", repeatMode !== "off" ? "text-[#1ed760]" : "text-[#b3b3b3] hover:text-white", "after:content-[''] after:absolute after:-bottom-1.5 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:bg-[#1ed760] after:rounded-full", repeatMode !== "off" ? "after:opacity-100" : "after:opacity-0")}
            >
              {repeatMode === "one" ? <Repeat1 className="w-4 h-4 lg:w-5 lg:h-5" /> : <Repeat className="w-4 h-4 lg:w-5 lg:h-5" />}
            </button>
          </div>

          <div className="hidden sm:flex w-full h-4">
            <PlayerProgressBar />
          </div>
        </div>

        {/* ================= Right: Extra Controls ================= */}
        <div className="flex items-center justify-end gap-2 lg:gap-3 flex-1 lg:flex-3 text-[#b3b3b3]">

          {/* 歌词模态界面 */}
          <button onClick={() => toggleLyrics()} className={`hover:text-white transition-colors ${isLyricsOpen ? "text-[#1db954]" : ""}`}>
            <Mic2 className="w-4 h-4 lg:w-5 lg:h-5" />
          </button>

          {/* 播放列表模态界面 */}
          <div className="hidden md:block">
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="z-2000"
                style={{ position: 'relative' }}
              >
                <QueuePopover />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* TODO: 蓝牙 */}
          <div className="hidden lg:block">
            <button className="hover:text-white transition-colors flex items-center justify-center">
              <MonitorSpeaker className="w-4 h-4 lg:w-5 lg:h-5" />
            </button>
          </div>

          {/* 音量控制 */}
          <VolumeControl initialVolume={volume} onChange={(v) => usePlayerStore.getState().setVolume(v)} />

          {/* 最大化/最小化按钮 */}
          <button onClick={() => { if (isMaximized) { Minimize(isElectron); } else { Maximized(isElectron); } setIsMaximized(!isMaximized); }}
            className="hidden sm:block hover:text-white transition-colors">
            {isMaximized ? <MinimizeIcon className="w-4 h-4 lg:w-5 lg:h-5" /> : <Expand className="w-4 h-4 lg:w-5 lg:h-5" />}
          </button>
        </div>

      </div>
    </div>
  );
}
