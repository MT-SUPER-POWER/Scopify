"use client";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ PACKAGE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { useState } from "react";
import {
  ChevronLeft,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Repeat,
  Shuffle,
  Mic2,
  ListMusic,
  MonitorSpeaker,
  Heart,
  Expand,
  MinimizeIcon,
} from "lucide-react";
import { useIsElectron, useFullScreenListener } from "@/lib/hooks/useElectronDetect";
import { useLyrics } from "./LyricModal/LyricsContext";
import { VolumeControl } from "@/components/VolumeControl";
import { SmoothSlider } from "@/components/SmoothSlider";
import { cn } from "@/lib/utils";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ UTILS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// 最大化窗口
const Maximized = (isElectron: boolean) => {
  if (isElectron) {
    // Electron 环境：调用 Electron API 进入全屏
    window.electronAPI?.enterFullScreen();
  } else {
    // Web 环境：调用浏览器全屏 API
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen();
    }
  }
};

// 最小化窗口
const Minimize = (isElectron: boolean) => {
  if (isElectron) {
    // Electron 环境：调用 Electron API 退出全屏
    window.electronAPI?.exitFullScreen();
  } else {
    // Web 环境：退出浏览器全屏
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
  }
};


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ UI ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const PlayerBar = () => {
  const isElectron = useIsElectron();
  const { isLyricsOpen, openLyrics, toggleLyrics } = useLyrics();
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(30);
  const [isMaximized, setIsMaximized] = useState(false);
  const [volume, setVolume] = useState(70);

  // 监听全屏状态变化（支持 Electron 和 Web 环境）
  useFullScreenListener((isFullScreen) => {
    setIsMaximized(isFullScreen);
  });

  // 处理音量变化（可以连接到实际的音频播放器）
  const handleVolumeChange = (newVolume: number) => {
    // TODO: 连接到实际的音频播放器
    setVolume(newVolume);
  };

  return (
    <div className={cn(
      "h-17 lg:h-20 bg-black w-full flex px-4 items-center justify-between z-20",
      "transition-all ease-linear duration-300"
    )}>

      {/* Left: Song Info */}
      <div className="flex items-center gap-3.5 flex-3">
        <div className="w-14 h-14 rounded-md overflow-hidden relative group cursor-pointer shadow-[0_4px_12px_rgba(0,0,0,0.5)] bg-zinc-800">
          <img
            src="https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=100&auto=format&fit=crop"
            alt="Album"
            className="w-full h-full object-cover"
          />
          {/* 展示模态歌词页按钮 */}
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
            pocket locket
          </span>
          <span className="text-[11px] text-[#b3b3b3] hover:underline hover:text-white cursor-pointer truncate mt-0.5 font-normal">
            Alaina Castillo
          </span>
        </div>
        <Heart className="w-5 h-5 text-[#b3b3b3] hover:text-white cursor-pointer ml-1" />
      </div>

      {/* Center: Controls */}
      <div className="flex flex-col items-center justify-center max-w-180.5 flex-4 gap-1.5">
        <div className="flex items-center gap-5 mt-1">
          <button className="text-[#b3b3b3] hover:text-white transition-colors relative after:content-[''] after:absolute after:-bottom-1.5 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:bg-[#1ed760] after:rounded-full after:opacity-0 hover:after:opacity-100">
            <Shuffle className="w-5 h-5" />
          </button>
          <button className="text-[#b3b3b3] hover:text-white transition-colors">
            <SkipBack className="w-5 h-5 fill-current" />
          </button>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white text-black hover:scale-105 transition-all hover:bg-gray-200 active:scale-95"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current" />
            )}
          </button>

          <button className="text-[#b3b3b3] hover:text-white transition-colors">
            <SkipForward className="w-5 h-5 fill-current" />
          </button>
          <button className="text-[#b3b3b3] hover:text-white transition-colors">
            <Repeat className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="flex items-center gap-2 w-full max-w-150">
          <span className="text-[11px] text-[#b3b3b3] w-10 text-right tabular-nums tracking-widest font-normal">
            {/* TODO: 换成动态的时间 */}
            1:12
          </span>
          <SmoothSlider
            value={progress}
            onChange={setProgress}
            orientation="horizontal"
            className="flex-1"
            trackThickness={4}
            thumbSize={12}
            thumbOnHover={true}
          />
          <span className="text-[11px] text-[#b3b3b3] w-10 tabular-nums tracking-widest font-normal">
            3:45
          </span>
        </div>
      </div>

      {/* Right: Extra Controls */}
      <div className="flex items-center justify-end gap-3 flex-3 text-[#b3b3b3]">
        <button
          onClick={() => toggleLyrics()}
          className={`hover:text-white transition-colors ${isLyricsOpen ? "text-[#1db954]" : ""}`}
          title="歌词"      // TODO: 制作 icon 浮动窗
        >
          <Mic2 className="w-5 h-5" />
        </button>
        <button className="hover:text-white transition-colors">
          <ListMusic className="w-5 h-5" />
        </button>
        <button className="hover:text-white transition-colors">
          <MonitorSpeaker className="w-5 h-5" />
        </button>

        {/* 音量控制 - Hover 时弹出垂直滑块 */}
        <VolumeControl initialVolume={volume} onChange={handleVolumeChange} />

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
  );
};
