"use client";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ PACKAGE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TODO: 空格快捷键开启和暂停歌曲的播放

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
  ListMusic,
  MonitorSpeaker,
  Heart,
  Expand,
  MinimizeIcon,
} from "lucide-react";
import { useIsElectron, useFullScreenListener } from "@/lib/hooks/useElectronDetect";
import { useUiStore } from "@/store/module/ui";
import { VolumeControl } from "@/components/VolumeControl";
import { SmoothSlider } from "@/components/SmoothSlider";
import { cn, formatDuration } from "@/lib/utils";
import { usePlayerStore } from "@/store";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ UTILS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

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

  const volume = usePlayerStore(s => s.volume);
  const isPlaying = usePlayerStore(s => s.isPlaying);
  const currentSong = usePlayerStore(s => s.currentSongDetail);
  const currentSongUrl = usePlayerStore(s => s.currentSongUrl);
  const currentTime = usePlayerStore(s => s.currentTime);
  const totalTime = usePlayerStore(s => s.totalTime);
  const repeatMode = usePlayerStore(s => s.repeatMode);
  const isShuffle = usePlayerStore(s => s.isShuffle);
  const setIsPlaying = usePlayerStore(s => s.setIsPlaying);
  const setCurrentTime = usePlayerStore(s => s.setCurrentTime);
  const setRepeatMode = usePlayerStore(s => s.setRepeatMode);
  const toggleShuffle = usePlayerStore(s => s.toggleShuffle);
  const playNext = usePlayerStore(s => s.playNext);
  const playPrev = usePlayerStore(s => s.playPrev);

  // 当 url 变化时加载新歌
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentSongUrl) return;
    audio.src = currentSongUrl;
    audio.load();
    if (isPlaying) audio.play().catch(console.error);
  }, [currentSongUrl]);

  // 同步 isPlaying 到 audio 元素
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentSongUrl) return;
    if (isPlaying) {
      audio.play().catch(console.error);
    } else {
      audio.pause();
    }
  }, [isPlaying]);

  // 同步音量
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  // 进度拖拽
  const handleSeek = (value: number) => {
    const newTime = (value / 100) * (totalTime / 1000);
    if (audioRef.current) audioRef.current.currentTime = newTime;
    setCurrentTime(newTime * 1000);
  };

  const progressPercent = totalTime > 0 ? (currentTime / totalTime) * 100 : 0;

  const cycleRepeat = () => {
    const modes = ["off", "all", "one"] as const;
    const next = modes[(modes.indexOf(repeatMode) + 1) % modes.length];
    setRepeatMode(next);
  };

  useFullScreenListener((isFullScreen) => {
    setIsMaximized(isFullScreen);
  });

  return (
    <>
      {/* 隐藏的 audio 元素，负责实际播放 */}
      <audio
        ref={audioRef}
        onTimeUpdate={() => {
          if (audioRef.current) setCurrentTime(audioRef.current.currentTime * 1000);
        }}
        onEnded={() => playNext()}
        onCanPlay={() => {
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
          <Heart className="w-5 h-5 text-[#b3b3b3] hover:text-white cursor-pointer ml-1" />
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
            <button onClick={() => playPrev()} className="text-[#b3b3b3] hover:text-white transition-colors">
              <SkipBack className="w-5 h-5 fill-current" />
            </button>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              disabled={!currentSong}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white text-black hover:scale-105 transition-all hover:bg-gray-200 active:scale-95 disabled:opacity-40"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 fill-current" />
              ) : (
                <Play className="w-5 h-5 fill-current" />
              )}
            </button>
            <button onClick={() => playNext()} className="text-[#b3b3b3] hover:text-white transition-colors">
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
        </div>

        {/* Right: Extra Controls */}
        <div className="flex items-center justify-end gap-3 flex-3 text-[#b3b3b3]">
          <button
            onClick={() => toggleLyrics()}
            className={`hover:text-white transition-colors ${isLyricsOpen ? "text-[#1db954]" : ""}`}
            title="歌词"
          >
            <Mic2 className="w-5 h-5" />
          </button>
          <button className="hover:text-white transition-colors">
            <ListMusic className="w-5 h-5" />
          </button>
          <button className="hover:text-white transition-colors">
            <MonitorSpeaker className="w-5 h-5" />
          </button>

          <VolumeControl initialVolume={volume} onChange={(v) => usePlayerStore.getState().setVolume(v)} />

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


