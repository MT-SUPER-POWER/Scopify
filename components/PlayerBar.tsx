"use client";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ PACKAGE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Repeat,
  Repeat1,
  Shuffle,
  Mic2,
  MonitorSpeaker,
  Heart,
  Expand,
  MinimizeIcon,
} from "lucide-react";
import { FaRegCommentDots } from "react-icons/fa6";
import { useFullScreenListener } from "@/lib/hooks/useElectronDetect";
import { useUiStore } from "@/store/module/ui";
import { VolumeControl } from "@/components/VolumeControl";
import { SmoothSlider } from "@/components/SmoothSlider";
import { QueuePopover } from "@/components/QueuePopover";
import { cn, formatDuration, IS_ELECTRON } from "@/lib/utils";
import { usePlayerStore, useUserStore } from "@/store";
import { useTimeStore } from "@/store/module/time";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ UTILS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const PlayerProgressBar = ({ audioRef }: { audioRef: React.RefObject<HTMLAudioElement | null> }) => {
  const currentTime = useTimeStore(s => s.currentTime);
  const totalTime = useTimeStore(s => s.totalTime);
  const setCurrentTime = useTimeStore(s => s.setCurrentTime);
  const [bufferedPercent, setBufferedPercent] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const update = () => {
      if (!audio.duration || !audio.buffered.length) return;
      const pct = (audio.buffered.end(audio.buffered.length - 1) / audio.duration) * 100;
      setBufferedPercent(pct);
      useTimeStore.getState().setBufferedTime(audio.buffered.end(audio.buffered.length - 1));
    };
    audio.addEventListener("progress", update);
    audio.addEventListener("timeupdate", update);
    return () => {
      audio.removeEventListener("progress", update);
      audio.removeEventListener("timeupdate", update);
    };
  }, [audioRef]);

  const handleSeek = (value: number) => {
    const newTime = (value / 100) * (totalTime / 1000);
    if (audioRef.current) audioRef.current.currentTime = newTime;
    setCurrentTime(newTime * 1000);
  };

  const progressPercent = totalTime > 0 ? (currentTime / totalTime) * 100 : 0;

  return (
    <div className="flex items-center gap-2 w-full max-w-150">
      <span className="text-[11px] text-[#b3b3b3] w-10 text-right tabular-nums tracking-widest font-normal">
        {formatDuration(currentTime)}
      </span>
      <SmoothSlider
        value={progressPercent}
        bufferedValue={bufferedPercent}
        onChange={handleSeek}
        orientation="horizontal"
        className="flex-1"
        trackThickness={4}
        thumbSize={12}
        thumbOnHover={true}
      />
      <span className="text-[11px] text-[#b3b3b3] w-10 tabular-nums tracking-widest font-normal">
        {formatDuration(totalTime)}
      </span>
    </div>
  );
};

const Maximized = (isElectron: boolean) => {
  if (isElectron) {
    window.electronAPI?.enterFullScreen();
  } else {
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen();
    }
  }
};

const Minimize = (isElectron: boolean) => {
  if (isElectron) {
    window.electronAPI?.exitFullScreen();
  } else {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
  }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ UI ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const PlayerBar = () => {
  const isElectron = IS_ELECTRON;
  const isLyricsOpen = useUiStore(s => s.isLyricsOpen);
  const toggleLyrics = useUiStore(s => s.toggleLyrics);
  const openLyrics = () => useUiStore.getState().setIsLyricsOpen(true);
  const [isMaximized, setIsMaximized] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const hasRestoredProgressRef = useRef(false);
  const restoreTargetMsRef = useRef(0);
  const lastSongIdRef = useRef<number | null>(null);
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

  // 当 url 变化时加载新歌
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentSongUrl) return;
    const persistedTime = useTimeStore.getState().currentTime;
    const shouldAutoPlay = usePlayerStore.getState().isPlaying;
    const currentSongId = currentSong?.id ?? null;
    const isSongSwitched =
      lastSongIdRef.current !== null &&
      currentSongId !== null &&
      lastSongIdRef.current !== currentSongId;

    // 切歌后强制从 0 开始；同一首歌刷新/重连才允许恢复进度
    restoreTargetMsRef.current = isSongSwitched ? 0 : persistedTime;
    lastSongIdRef.current = currentSongId;

    hasRestoredProgressRef.current = false;
    // NOTE: 如果 URL 没变，说明是刷新或重连，不需要重新设置 src 导致重头播放
    if (audio.src !== currentSongUrl) {
      audio.src = currentSongUrl;
      audio.load();
    }

    // 🚀 核心优化：刷新后静默恢复歌词
    usePlayerStore.getState().fetchCurrentLyric();

    const restoreProgress = () => {
      // 如果已经恢复过，或者进度原本就是 0（新歌），则标记为已处理并返回
      if (hasRestoredProgressRef.current) return;
      if (restoreTargetMsRef.current <= 0) {
        audio.currentTime = 0;
        hasRestoredProgressRef.current = true;
        return;
      }
      const restoreSeconds = restoreTargetMsRef.current / 1000;
      const duration = Number.isFinite(audio.duration) ? audio.duration : 0;
      audio.currentTime = duration > 0 ? Math.min(restoreSeconds, duration) : restoreSeconds;
      hasRestoredProgressRef.current = true;
    };

    if (audio.readyState >= 1) {
      restoreProgress();
    } else {
      audio.addEventListener("loadedmetadata", restoreProgress, { once: true });
    }

    if (shouldAutoPlay) {
      audio.play().catch((err) => {
        if (err.name === "AbortError") {
          // Play request was interrupted, ignore safely
          return;
        } else if (err.name === "NotAllowedError") {
          console.warn("Autoplay blocked: Waiting for user interaction.");
          setIsPlaying(false);
        } else {
          console.error("Audio play error:", err);
        }
      });
    }
  }, [currentSongUrl, isPlaying, isElectron, currentSong?.id, setIsPlaying]);

  // 同步 isPlaying 到 audio 元素
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentSongUrl) return;
    if (isPlaying) {
      audio.play().catch((err) => {
        if (err.name === "AbortError") {
          // Play request was interrupted, ignore safely
          return;
        } else if (err.name === "NotAllowedError") {
          console.warn("Playback blocked by browser policy. User must interact first.");
          setIsPlaying(false);
          // 这里可以考虑触发一个全局提示或按钮高亮
        } else {
          // 只把真实的非常规错误抛出
          console.error("Audio play error:", err);
        }
      });
    } else {
      audio.pause();
    }

    // 同步状态到 Electron 主进程，用于更新任务栏按钮
    if (isElectron && window.electronAPI?.send) {
      window.electronAPI.send("player-state-changed", { isPlaying });
    }
  }, [isPlaying, isElectron, currentSongUrl, setIsPlaying]);

  // 同步音量
  useEffect(() => {
    if (audioRef.current) {
      // 确保输出值严格限制在 0.0 到 1.0 之间
      audioRef.current.volume = Math.max(0, Math.min(1, volume / 100));
    }
  }, [volume]);

  // 切换播放模式
  const cycleRepeat = () => {
    const modes = ["off", "all", "one"] as const;
    const next = modes[(modes.indexOf(repeatMode) + 1) % modes.length];
    setRepeatMode(next);
  };

  // 监听全局寻址事件 (用于歌词页等外部组件调节进度)
  useEffect(() => {
    const handleSeekEvent = (e: CustomEvent<number>) => {
      const newTimeMs = e.detail;
      if (audioRef.current) {
        audioRef.current.currentTime = newTimeMs / 1000;
        useTimeStore.getState().setCurrentTime(newTimeMs);
      }
    };
    window.addEventListener('player-seek', handleSeekEvent as EventListener);
    return () => {
      window.removeEventListener('player-seek', handleSeekEvent as EventListener);
    };
  }, []);

  // NOTE: 快捷键支持: 空格(播放/暂停), Ctrl+Left(上一首), Ctrl+Right(下一首)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // 如果是在输入框中，不触发快捷键
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.code === "Space") {
        e.preventDefault();
        setIsPlaying(!isPlaying);
      } else if (e.ctrlKey && e.code === "ArrowLeft") {
        e.preventDefault();
        playPrev();
      } else if (e.ctrlKey && e.code === "ArrowRight") {
        e.preventDefault();
        playNext();
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [isPlaying, setIsPlaying, playPrev, playNext]);

  useFullScreenListener((isFullScreen) => {
    setIsMaximized(isFullScreen);
  });

  // 监听来自 Electron 主进程的任务栏控制（Thumbnail Toolbar）
  useEffect(() => {
    if (!isElectron || !window.electronAPI?.on) return;

    window.electronAPI.on("control-audio", (event: any, action: any) => {
      console.log("[PlayerBar] Received control-audio action:", action);
      switch (action) {
        case "play":
          setIsPlaying(true);
          break;
        case "pause":
          setIsPlaying(false);
          break;
        case "prev":
          playPrev();
          break;
        case "next":
          playNext();
          break;
      }
    });

  }, [isElectron, setIsPlaying, playPrev, playNext]);

  return (
    <div className={cn(
      "h-17 lg:h-20 bg-black w-full flex px-2 items-center justify-between z-20",
      "transition-all ease-linear duration-300",
    )}>
      {/* 播放 */}
      <audio
        className="hidden"
        ref={audioRef}
        onTimeUpdate={() => {
          if (audioRef.current) {
            if (!audioRef.current.paused) {
              useTimeStore.getState().setCurrentTime(audioRef.current.currentTime * 1000);
            }
          }
        }}
        onDurationChange={() => {
          if (audioRef.current && audioRef.current.duration > 0) {
            useTimeStore.getState().setTotalTime(audioRef.current.duration * 1000);
          }
        }}
        onEnded={() => playNext()}
        onCanPlay={() => {
          const audio = audioRef.current;
          if (audio && !hasRestoredProgressRef.current) {
            const restoreSeconds = restoreTargetMsRef.current / 1000;
            if (restoreSeconds > 0) {
              if (Number.isFinite(audio.duration) && audio.duration > 0) {
                audio.currentTime = Math.min(restoreSeconds, audio.duration);
              } else {
                audio.currentTime = restoreSeconds;
              }
            } else {
              audio.currentTime = 0;
            }
            hasRestoredProgressRef.current = true;
          }
          if (isPlaying) audioRef.current?.play().catch(console.error);
        }}
      />

      <div className={cn(
        "h-17 lg:h-20 bg-black w-full flex px-4 items-center justify-between z-20",
        "transition-all ease-linear duration-300"
      )}>

        {/* Left: Song Info */}
        <div className="flex items-center gap-3 lg:gap-4 min-w-0 flex-1 lg:flex-3">

          {/* 封面 */}
          <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-md overflow-hidden relative group cursor-pointer shadow-[0_4px_12px_rgba(0,0,0,0.5)] bg-zinc-800 shrink-0">
            {currentSong?.al.picUrl && (
              <img
                src={currentSong.al.picUrl}
                alt={currentSong.al.name}
                className="w-full h-full object-cover"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
              />
            )}
            <div
              onClick={openLyrics}
              className={cn(
                "absolute top-[25%] left-[25%]",
                "opacity-0 group-hover:opacity-100 bg-black/70 rounded-full p-1",
                "transition-opacity backdrop-blur-sm hover:scale-105 hover:bg-black/80",
                "flex items-center justify-center",
              )}>
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
              <Heart className={cn(
                "w-4 h-4 lg:w-5 lg:h-5 text-[#b3b3b3] hover:text-white cursor-pointer",
                `${isLiked && "fill-[#1ed760] text-[#1ed760]"}`
              )} />
            </button>
            <Link
              href={currentSong?.id ? `/comment?songId=${currentSong.id}` : "#"}
              title="Comment"
              onClick={(e) => !currentSong?.id && e.preventDefault()}
            >
              <FaRegCommentDots className="w-4 h-4 lg:w-5 lg:h-5 text-[#b3b3b3] hover:text-white cursor-pointer ml-1" />
            </Link>
          </div>
        </div>

        {/* Center: Controls */}
        <div className="flex flex-col items-center justify-center flex-2 lg:flex-4 gap-1.5 min-w-0">
          <div className="flex items-center gap-4 lg:gap-5 mt-1">
            <button
              onClick={toggleShuffle}
              title={isShuffle ? "Disable Shuffle" : "Enable Shuffle"}
              className={cn(
                "hidden sm:block transition-colors relative",
                isShuffle ? "text-[#1ed760]" : "text-[#b3b3b3] hover:text-white",
                "after:content-[''] after:absolute after:-bottom-1.5 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:bg-[#1ed760] after:rounded-full",
                isShuffle ? "after:opacity-100" : "after:opacity-0"
              )}
            >
              <Shuffle className="w-4 h-4 lg:w-5 lg:h-5" />
            </button>
            <button
              onClick={() => playPrev()}
              className="text-[#b3b3b3] hover:text-white transition-colors"
              title="Previous Song (Ctrl + Left)"
            >
              <SkipBack className="w-4 h-4 lg:w-5 lg:h-5 fill-current" />
            </button>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              disabled={!currentSong}
              className="w-9 h-9 lg:w-10 lg:h-10 flex items-center justify-center rounded-full bg-white text-black hover:scale-105 transition-all hover:bg-gray-200 active:scale-95 disabled:opacity-40"
              title={isPlaying ? "Pause (Space)" : "Play (Space)"}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 lg:w-5 lg:h-5 fill-current" />
              ) : (
                <Play className="w-4 h-4 lg:w-5 lg:h-5 fill-current" />
              )}
            </button>
            <button
              onClick={() => playNext()}
              className="text-[#b3b3b3] hover:text-white transition-colors"
              title="Next Song (Ctrl + Right)"
            >
              <SkipForward className="w-4 h-4 lg:w-5 lg:h-5 fill-current" />
            </button>
            <button
              onClick={cycleRepeat}
              title={repeatMode === "off" ? "No Repeat" : repeatMode === "all" ? "Repeat All" : "Repeat One"}
              className={cn(
                "hidden sm:block transition-colors relative",
                repeatMode !== "off" ? "text-[#1ed760]" : "text-[#b3b3b3] hover:text-white",
                "after:content-[''] after:absolute after:-bottom-1.5 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:bg-[#1ed760] after:rounded-full",
                repeatMode !== "off" ? "after:opacity-100" : "after:opacity-0"
              )}
            >
              {repeatMode === "one" ? <Repeat1 className="w-4 h-4 lg:w-5 lg:h-5" /> : <Repeat className="w-4 h-4 lg:w-5 lg:h-5" />}
            </button>
          </div>

          {/* Progress Bar */}
          <div className="hidden sm:flex w-full">
            <PlayerProgressBar audioRef={audioRef} />
          </div>
        </div>

        {/* Right: Extra Controls */}
        <div className="flex items-center justify-end gap-2 lg:gap-3 flex-1 lg:flex-3 text-[#b3b3b3]">
          <button
            onClick={() => toggleLyrics()}
            className={`hover:text-white transition-colors ${isLyricsOpen ? "text-[#1db954]" : ""}`}
            title="Lyrics"
          >
            <Mic2 className="w-4 h-4 lg:w-5 lg:h-5" />
          </button>

          {/* 播放列表 */}
          <div className="hidden md:block">
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              >
                <QueuePopover />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* TODO: 连接蓝牙 和 RN 同步 */}
          <div className="hidden lg:block">
            <button className="hover:text-white transition-colors flex items-center justify-center" title="Connect to Devices">
              <MonitorSpeaker className="w-4 h-4 lg:w-5 lg:h-5" />
            </button>
          </div>

          <VolumeControl initialVolume={volume} onChange={(v) => usePlayerStore.getState().setVolume(v)} />

          <button
            onClick={() => {
              isMaximized ? Minimize(isElectron) : Maximized(isElectron);
              setIsMaximized(!isMaximized);
            }}
            className="hidden sm:block hover:text-white transition-colors"
          >
            {isMaximized ? (
              <MinimizeIcon className="w-4 h-4 lg:w-5 lg:h-5" />
            ) : (
              <Expand className="w-4 h-4 lg:w-5 lg:h-5" />
            )}
          </button>
        </div>

      </div>
    </div>
  );
};


