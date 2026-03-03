"use client";

import { useState } from "react";
import {
  ChevronLeft,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  Repeat,
  Shuffle,
  Mic2,
  ListMusic,
  MonitorSpeaker,
  Maximize2,
  Heart,
} from "lucide-react";

export const PlayerBar = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isHoveringProgress, setIsHoveringProgress] = useState(false);
  const [progress, setProgress] = useState(30);

  return (
    <div className="h-22.5 bg-black w-full flex items-center px-4 justify-between shrink-0 z-20">
      {/* Left: Song Info */}
      <div className="flex items-center gap-3.5 w-[30%] min-w-45">
        <div className="w-14 h-14 rounded-md overflow-hidden relative group cursor-pointer shadow-[0_4px_12px_rgba(0,0,0,0.5)] bg-zinc-800">
          <img
            src="https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=100&auto=format&fit=crop"
            alt="Album"
            className="w-full h-full object-cover"
          />
          <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 bg-black/70 rounded-full p-1 transition-opacity backdrop-blur-sm hover:scale-105 hover:bg-black/80">
            <ChevronLeft className="w-4 h-4 rotate-90 text-white" />
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
        <Heart className="w-4 h-4 text-[#b3b3b3] hover:text-white cursor-pointer ml-1" />
      </div>

      {/* Center: Controls */}
      <div className="flex flex-col items-center justify-center max-w-180.5 w-[40%] gap-1.5">
        <div className="flex items-center gap-5 mt-1">
          <button className="text-[#b3b3b3] hover:text-white transition-colors relative after:content-[''] after:absolute after:-bottom-1.5 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:bg-[#1ed760] after:rounded-full after:opacity-0 hover:after:opacity-100">
            <Shuffle className="w-4.5 h-4.5" />
          </button>
          <button className="text-[#b3b3b3] hover:text-white transition-colors">
            <SkipBack className="w-5 h-5 fill-current" />
          </button>

          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white text-black hover:scale-105 transition-all hover:bg-gray-200 active:scale-95"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-current" />
            ) : (
              <Play className="w-4 h-4 fill-current ml-0.5" />
            )}
          </button>

          <button className="text-[#b3b3b3] hover:text-white transition-colors">
            <SkipForward className="w-5 h-5 fill-current" />
          </button>
          <button className="text-[#b3b3b3] hover:text-white transition-colors">
            <Repeat className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div
          className="flex items-center gap-2 w-full max-w-150 group cursor-pointer"
          onMouseEnter={() => setIsHoveringProgress(true)}
          onMouseLeave={() => setIsHoveringProgress(false)}
        >
          <span className="text-[11px] text-[#b3b3b3] w-10 text-right tabular-nums tracking-widest font-normal">
            1:12
          </span>
          <div
            className="h-1 bg-[#4d4d4d] rounded-full flex-1 relative overflow-hidden group-hover:bg-[#5e5e5e]"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const percent = ((e.clientX - rect.left) / rect.width) * 100;
              setProgress(percent);
            }}
          >
            <div
              className={`h-full rounded-full relative transition-[background-color] ${isHoveringProgress ? "bg-[#1db954]" : "bg-white"}`}
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          {isHoveringProgress && (
            <div
              className="absolute h-3 w-3 bg-white rounded-full shadow-md z-10 -ml-1.5 focus:scale-125"
              style={{
                left: `calc(30% + 40px + ((min(100%, 600px) - 80px) * ${progress} / 100))`,
              }} // Approximate positioning for demo
            />
          )}
          <span className="text-[11px] text-[#b3b3b3] w-10 tabular-nums tracking-widest font-normal">
            3:45
          </span>
        </div>
      </div>

      {/* Right: Extra Controls */}
      <div className="flex items-center justify-end gap-3 w-[30%] min-w-45 text-[#b3b3b3]">
        <button className="hover:text-white transition-colors">
          <Mic2 className="w-4.5 h-4.5" />
        </button>
        <button className="hover:text-white transition-colors">
          <ListMusic className="w-4.5 h-4.5" />
        </button>
        <button className="hover:text-white transition-colors">
          <MonitorSpeaker className="w-4.5 h-4.5" />
        </button>

        <div
          className="flex items-center gap-2 w-23.25 group cursor-pointer"
          title="Mute"
        >
          <button className="hover:text-white transition-colors shrink-0">
            <Volume2 className="w-4.5 h-4.5" />
          </button>
          <div className="h-1 bg-[#4d4d4d] rounded-full flex-1 relative group-hover:bg-[#5e5e5e]">
            <div className="h-full bg-white group-hover:bg-[#1db954] rounded-full w-2/3 relative">
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 hover:scale-125"></div>
            </div>
          </div>
        </div>

        <button className="hover:text-white transition-colors">
          <Maximize2 className="w-4.5 h-4.5" />
        </button>
      </div>
    </div>
  );
};
