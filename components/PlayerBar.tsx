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
import { useIsElectron, useFullScreenListener } from "@/lib/hooks/useElectronDetect";
import { useUiStore } from "@/store/module/ui";
import { VolumeControl } from "@/components/VolumeControl";
import { SmoothSlider } from "@/components/SmoothSlider";
import { QueuePopover } from "@/components/QueuePopover";
import { cn, formatDuration } from "@/lib/utils";
import { usePlayerStore, useUserStore } from "@/store";
import Link from "next/link";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ UTILS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const PlayerProgressBar = ({ audioRef }: { audioRef: React.RefObject<HTMLAudioElement | null> }) => {
  const currentTime = usePlayerStore(s => s.currentTime);
  const totalTime = usePlayerStore(s => s.totalTime);
  const setCurrentTime = usePlayerStore(s => s.setCurrentTime);

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
  const isElectron = useIsElectron();
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
  const setCurrentTime = usePlayerStore(s => s.setCurrentTime);
  const setTotalTime = usePlayerStore(s => s.setTotalTime);
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
    const snapshot = usePlayerStore.getState();
    const persistedTime = snapshot.currentTime;
    const shouldAutoPlay = snapshot.isPlaying;
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
      audioRef.current.volume = volume / 100;
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
        setCurrentTime(newTimeMs);
      }
    };
    window.addEventListener('player-seek', handleSeekEvent as EventListener);
    return () => {
      window.removeEventListener('player-seek', handleSeekEvent as EventListener);
    };
  }, [setCurrentTime]);

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
    <>
      {/*
      播放
      BUG: 播放响应特别慢，不是说上下首切换的慢，而是播放和暂停响应特别慢
      */}
      <audio
        ref={audioRef}
        onTimeUpdate={() => {
          if (audioRef.current) {
            // 只有当播放器真的在播放时，才同步进度
            if (!audioRef.current.paused) {
              setCurrentTime(audioRef.current.currentTime * 1000);
            }
          }
        }}
        onDurationChange={() => {
          if (audioRef.current && audioRef.current.duration > 0) {
            setTotalTime(audioRef.current.duration * 1000);
          }
        }}
        onEnded={() => playNext()}
        onCanPlay={() => {
          const audio = audioRef.current;
          if (audio && !hasRestoredProgressRef.current) {
            const restoreSeconds = restoreTargetMsRef.current / 1000;

            if (restoreSeconds > 0) {
              // 确保 duration 已加载
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
        <div className="flex items-center gap-3.5 flex-3">
          <div className="w-14 h-14 rounded-md overflow-hidden relative group cursor-pointer shadow-[0_4px_12px_rgba(0,0,0,0.5)] bg-zinc-800">
            {currentSong?.al.picUrl && (
              <img
                src={currentSong.al.picUrl}
                alt={currentSong.al.name}
                className="w-full h-full object-cover"
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
          <div className="flex flex-col justify-center max-w-50">
            <span className="text-sm text-white hover:underline cursor-pointer truncate font-medium">
              {currentSong?.name ?? "—"}
            </span>
            <span className="text-[11px] text-[#b3b3b3] hover:underline hover:text-white cursor-pointer truncate mt-0.5 font-normal">
              {currentSong?.ar.map(a => a.name).join(", ") ?? "—"}
            </span>
          </div>
          <button title="Like">
            <Heart className={cn(
              "w-5 h-5 text-[#b3b3b3] hover:text-white cursor-pointer ml-1",
              `${isLiked && "fill-[#1ed760] text-[#1ed760]"}`
            )} />
          </button>
          <Link
            href={currentSong?.id ? `/comment?songId=${currentSong.id}` : "#"}
            title="Comment"
            onClick={(e) => !currentSong?.id && e.preventDefault()}
          >
            <FaRegCommentDots className="w-5 h-5 text-[#b3b3b3] hover:text-white cursor-pointer ml-1" />
          </Link>
        </div>

        {/* Center: Controls */}
        <div className="flex flex-col items-center justify-center max-w-180.5 flex-4 gap-1.5">
          <div className="flex items-center gap-5 mt-1">
            <button
              onClick={toggleShuffle}
              className={cn(
                "transition-colors relative",
                isShuffle ? "text-[#1ed760]" : "text-[#b3b3b3] hover:text-white",
                "after:content-[''] after:absolute after:-bottom-1.5 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:bg-[#1ed760] after:rounded-full",
                isShuffle ? "after:opacity-100" : "after:opacity-0"
              )}
            >
              <Shuffle className="w-5 h-5" />
            </button>
            <button
              onClick={() => playPrev()}
              className="text-[#b3b3b3] hover:text-white transition-colors"
              title="上一首 (Ctrl + Left)"
            >
              <SkipBack className="w-5 h-5 fill-current" />
            </button>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              disabled={!currentSong}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white text-black hover:scale-105 transition-all hover:bg-gray-200 active:scale-95 disabled:opacity-40"
              title={isPlaying ? "暂停 (Space)" : "播放 (Space)"}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 fill-current" />
              ) : (
                <Play className="w-5 h-5 fill-current" />
              )}
            </button>
            <button
              onClick={() => playNext()}
              className="text-[#b3b3b3] hover:text-white transition-colors"
              title="下一首 (Ctrl + Right)"
            >
              <SkipForward className="w-5 h-5 fill-current" />
            </button>
            <button
              onClick={cycleRepeat}
              className={cn(
                "transition-colors relative",
                repeatMode !== "off" ? "text-[#1ed760]" : "text-[#b3b3b3] hover:text-white",
                "after:content-[''] after:absolute after:-bottom-1.5 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:bg-[#1ed760] after:rounded-full",
                repeatMode !== "off" ? "after:opacity-100" : "after:opacity-0"
              )}
            >
              {repeatMode === "one" ? <Repeat1 className="w-5 h-5" /> : <Repeat className="w-5 h-5" />}
            </button>
          </div>

          {/* Progress Bar */}
          <PlayerProgressBar audioRef={audioRef} />
        </div>

        {/* Right: Extra Controls */}
        <div className="flex items-center justify-end gap-3 flex-3 text-[#b3b3b3]">
          <button
            onClick={() => toggleLyrics()}
            className={`hover:text-white transition-colors ${isLyricsOpen ? "text-[#1db954]" : ""}`}
            title="Lyrics"
          >
            <Mic2 className="w-5 h-5" />
          </button>

          <QueuePopover />

          <button className="hover:text-white transition-colors" title="Connect to Devices">
            <MonitorSpeaker className="w-5 h-5" />
          </button>

          <VolumeControl initialVolume={volume} onChange={(v) => usePlayerStore.getState().setVolume(v)} />

          {/* 全屏 */}
          <button
            onClick={() => {
              isMaximized ? Minimize(isElectron) : Maximized(isElectron);
              setIsMaximized(!isMaximized);
            }}
            className="hover:text-white transition-colors"
          >
            {isMaximized ? (
              <MinimizeIcon className="w-5 h-5" />
            ) : (
              <Expand className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </>
  );
};


