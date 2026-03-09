"use client";

import { useState, useRef, useEffect } from "react";
import { Volume, Volume1, Volume2, VolumeOff } from "lucide-react";
import { SmoothSlider } from "./SmoothSlider";

interface VolumeControlProps {
  initialVolume?: number;
  onChange?: (volume: number) => void;
  orientation?: "vertical" | "horizontal";
  variant?: "popup" | "inline"; // 控制显示形态
}

export const VolumeControl = ({
  initialVolume = 70,
  onChange,
  orientation = "vertical",
  variant = "popup",
}: VolumeControlProps) => {
  const [volume, setVolume] = useState(initialVolume);
  const [isMuted, setMuted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setVolume(initialVolume);
  }, [initialVolume]);

  const getVolumeIcon = () => {
    if (isMuted || volume === 0) {
      return <VolumeOff className="w-5 h-5" />;
    } else if (volume < 33) {
      return <Volume className="w-5 h-5" />;
    } else if (volume < 66) {
      return <Volume1 className="w-5 h-5" />;
    } else {
      return <Volume2 className="w-5 h-5" />;
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    if (newVolume > 0 && isMuted) {
      setMuted(false);
    }
    onChange?.(newVolume);
  };

  const handleMuteToggle = () => {
    setMuted(!isMuted);
    onChange?.(isMuted ? volume : 0);
  };

  // 点击外部关闭 (仅针对弹窗模式生效)
  useEffect(() => {
    if (variant !== "popup") return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [variant]);

  // 🟢 形态 1：常驻内联模式 (推荐在 Tray 中使用)
  if (variant === "inline") {
    return (
      <div className="flex items-center w-full gap-3 px-4 py-2 hover:bg-white/5 transition-colors rounded-md min-w-0">
        <button
          onClick={handleMuteToggle}
          className="text-[#b3b3b3] hover:text-white transition-colors shrink-0"
        >
          {getVolumeIcon()}
        </button>
        <div className="flex-1 flex items-center min-w-12.5">
          <SmoothSlider
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            orientation={orientation}
            trackThickness={4}
            thumbSize={12}
            thumbOnHover={true}
          />
        </div>
        <span className="text-xs text-[#b3b3b3] font-medium tabular-nums w-8 text-right shrink-0">
          {isMuted ? 0 : volume}%
        </span>
      </div>
    );
  }

  // 🟢 形态 2：悬浮弹窗模式 (推荐在 PlayerBar 中使用)
  return (
    <div
      ref={containerRef}
      className="relative flex items-center justify-center"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button
        onClick={handleMuteToggle}
        className="text-[#b3b3b3] hover:text-white transition-colors p-1"
      >
        {getVolumeIcon()}
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 pb-2 z-50">
          <div className="bg-zinc-900 rounded-lg p-3 shadow-xl border border-zinc-700">
            <div className="flex flex-col items-center gap-2">
              <SmoothSlider
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                orientation={orientation}
                size={100}
                trackThickness={6}
                thumbSize={14}
                thumbOnHover={false}
              />
              <span className="text-xs text-white font-medium tabular-nums">
                {isMuted ? 0 : volume}%
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
