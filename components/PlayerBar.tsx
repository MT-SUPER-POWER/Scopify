"use client";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ PACKAGE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
import { useEffect, useRef, useState } from "react";
import {
  ChevronLeft, Play, Pause, SkipBack, SkipForward, Repeat, Repeat1, Shuffle,
  Mic2, MonitorSpeaker, Heart, Expand, MinimizeIcon,
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
export const PlayerBar = () => {
  const isElectron = IS_ELECTRON;
  const isLyricsOpen = useUiStore(s => s.isLyricsOpen);
  const toggleLyrics = useUiStore(s => s.toggleLyrics);
  const openLyrics = () => useUiStore.getState().setIsLyricsOpen(true);
  const [isMaximized, setIsMaximized] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);

  // Zustand Stores
  const volume = usePlayerStore(s => s.volume);
  const isPlaying = usePlayerStore(s => s.isPlaying);
  const currentSong = usePlayerStore(s => s.currentSongDetail);
  const currentSongUrl = usePlayerStore(s => s.currentSongUrl);
  const repeatMode = usePlayerStore(s => s.repeatMode);
  const isShuffle = usePlayerStore(s => s.isShuffle);
  const setIsPlaying = usePlayerStore(s => s.setIsPlaying);
  const setRepeatMode = usePlayerStore(s => s.setRepeatMode);
  const toggleShuffle = usePlayerStore(s => s.toggleShuffle);
  const playNext = usePlayerStore(s => s.playNext);
  const playPrev = usePlayerStore(s => s.playPrev);
  const likelist = useUserStore((s) => s.likeListIDs) || [];
  const isLiked = Array.isArray(likelist) ? likelist.includes(currentSong?.id ?? -1) : false;

  // 切换播放模式
  const cycleRepeat = () => {
    const modes = ["off", "all", "one"] as const;
    const next = modes[(modes.indexOf(repeatMode) + 1) % modes.length];
    setRepeatMode(next);
  };

  // 1. 负责加载音频 URL
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentSongUrl) return;

    if (audio.src !== currentSongUrl) {
      audio.src = currentSongUrl;
      audio.load();
    }
    usePlayerStore.getState().fetchCurrentLyric();
  }, [currentSongUrl]);

  // 2. 负责触发播放/暂停
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentSongUrl) return;
    if (isPlaying) {
      audio.play().catch((err) => {
        console.warn("Play interrupted or not allowed:", err);
        setIsPlaying(false);
      });
    } else {
      audio.pause();
    }
  }, [isPlaying, currentSongUrl, setIsPlaying]);

  // 3. 负责同步音量
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = Math.max(0, Math.min(1, volume / 100));
    }
  }, [volume]);

  // 4. 和 ProgressBar 进行事件通信
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // 广播当前播放时间（毫秒）
    const onTimeUpdate = () => {
      window.dispatchEvent(new CustomEvent("player-time", { detail: audio.currentTime * 1000 }));
    };

    // 广播总时长（毫秒）
    const onDurationChange = () => {
      if (isFinite(audio.duration)) {
        window.dispatchEvent(new CustomEvent("player-duration", { detail: audio.duration * 1000 }));
      }
    };

    // 广播缓冲进度（毫秒）
    const onProgress = () => {
      if (audio.buffered.length > 0) {
        window.dispatchEvent(
          new CustomEvent("player-buffer", { detail: audio.buffered.end(audio.buffered.length - 1) * 1000 })
        );
      }
    };

    // 接收 ProgressBar 的 seek 指令
    const onSeek = (e: Event) => {
      audio.currentTime = (e as CustomEvent<number>).detail / 1000;
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("durationchange", onDurationChange);
    audio.addEventListener("progress", onProgress);
    window.addEventListener("player-seek", onSeek);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("durationchange", onDurationChange);
      audio.removeEventListener("progress", onProgress);
      window.removeEventListener("player-seek", onSeek);
    };
  }, []);


  return (
    <div className={cn(
      "h-17 lg:h-20 bg-black w-full flex px-2 items-center justify-between z-20",
      "transition-all ease-linear duration-300",
    )}>
      <audio
        className="hidden"
        ref={audioRef}
        onEnded={() => playNext()}
      />

      <div className="h-17 lg:h-20 bg-black w-full flex px-4 items-center justify-between z-20 transition-all ease-linear duration-300">

        {/* ================= Left: Song Info ================= */}
        <div className="flex items-center gap-3 lg:gap-4 min-w-0 flex-1 lg:flex-3">
          {/* 封面 */}
          <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-md overflow-hidden relative group cursor-pointer shadow-[0_4px_12px_rgba(0,0,0,0.5)] bg-zinc-800 shrink-0">
            {currentSong?.al.picUrl && (
              <Image
                width={96} height={96}
                src={currentSong.al.picUrl}
                alt={currentSong.al.name}
                className="w-full h-full object-cover"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
              />
            )}
            <div
              onClick={openLyrics}
              className="absolute top-[25%] left-[25%] opacity-0 group-hover:opacity-100 bg-black/70 rounded-full p-1 transition-opacity backdrop-blur-sm hover:scale-105 hover:bg-black/80 flex items-center justify-center">
              <ChevronLeft className="w-5 h-5 rotate-90 text-white" />
            </div>
          </div>

          {/* 歌曲信息 */}
          <div className="flex flex-col justify-center min-w-0 flex-1 max-w-25 lg:max-w-35">
            {currentSong ? (
              <>
                <span className="text-sm text-white hover:underline cursor-pointer truncate font-medium">
                  {currentSong.name}
                </span>
                <span className="text-[11px] text-[#b3b3b3] hover:underline hover:text-white cursor-pointer truncate mt-0.5 font-normal">
                  {currentSong.ar.map(a => a.name).join(", ")}
                </span>
              </>
            ) : (
              <div className="space-y-1.5">
                <div className="h-3 w-24 rounded-full bg-white/10" />
                <div className="h-2.5 w-16 rounded-full bg-white/10" />
              </div>
            )}
          </div>

          {/* Like and Comment */}
          <div className="hidden sm:flex items-center gap-3">
            <button title="Like">
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
              className="w-9 h-9 lg:w-10 lg:h-10 flex items-center justify-center rounded-full bg-white text-black hover:scale-105 transition-all hover:bg-gray-200 active:scale-95 disabled:opacity-40"
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
          <button onClick={() => toggleLyrics()} className={`hover:text-white transition-colors ${isLyricsOpen ? "text-[#1db954]" : ""}`}>
            <Mic2 className="w-4 h-4 lg:w-5 lg:h-5" />
          </button>

          <div className="hidden md:block">
            <AnimatePresence>
              <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.25, ease: "easeOut" }}>
                <QueuePopover />
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="hidden lg:block">
            <button className="hover:text-white transition-colors flex items-center justify-center">
              <MonitorSpeaker className="w-4 h-4 lg:w-5 lg:h-5" />
            </button>
          </div>

          <VolumeControl initialVolume={volume} onChange={(v) => usePlayerStore.getState().setVolume(v)} />

          <button onClick={() => { isMaximized ? Minimize(isElectron) : Maximized(isElectron); setIsMaximized(!isMaximized); }} className="hidden sm:block hover:text-white transition-colors">
            {isMaximized ? <MinimizeIcon className="w-4 h-4 lg:w-5 lg:h-5" /> : <Expand className="w-4 h-4 lg:w-5 lg:h-5" />}
          </button>
        </div>

      </div>
    </div>
  );
};
