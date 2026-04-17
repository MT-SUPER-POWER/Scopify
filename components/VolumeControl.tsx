"use client";

import { Volume, Volume1, Volume2, VolumeOff } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { SmoothSlider } from "./SmoothSlider";

interface VolumeControlProps {
  initialVolume?: number;
  onChange?: (volume: number) => void;
  orientation?: "vertical" | "horizontal";
  variant?: "popup" | "inline"; // 控制显示形态
  className?: string;
}

export const VolumeControl = ({
  initialVolume = 70,
  onChange,
  orientation = "vertical",
  variant = "popup",
  className = "",
}: VolumeControlProps) => {
  const [volume, setVolume] = useState(initialVolume);
  const [isMuted, setMuted] = useState(false);
  const prevVolumeRef = useRef<number>(initialVolume);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 用于存储防抖定时器的引用
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

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

  const handleVolumeChange = useCallback(
    (newVolume: number) => {
      // 1. 数据清洗：向下传递和本地状态都使用整数
      const roundedVolume = Math.round(newVolume);

      setVolume(roundedVolume);
      if (roundedVolume > 0 && isMuted) {
        setMuted(false);
      }

      // 2. 防抖处理
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        onChange?.(roundedVolume);
      }, 300);
    },
    [isMuted, onChange],
  );

  // 监听滚轮事件来控制音量
  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLDivElement>) => {
      // 阻止事件冒泡，防止在调节音量时触发外层容器的滚动
      e.stopPropagation();

      // 设定每次滚动的步长，5% 是比较常见的工程标准
      const step = 5;

      // deltaY < 0 表示向上滚动（放大音量），> 0 表示向下滚动（减小音量）
      const delta = e.deltaY < 0 ? step : -step;

      // 计算新音量并限制在 0-100 之间
      const newVolume = Math.max(0, Math.min(100, volume + delta));

      if (newVolume !== volume) {
        handleVolumeChange(newVolume);
      }
    },
    [volume, handleVolumeChange],
  );

  const handleMuteToggle = () => {
    const nextMuted = !isMuted;
    setMuted(nextMuted);

    // 静音属于点击动作，通常需要立即响应。
    // 这里清空之前的滑动防抖，防止冲突，直接触发 onChange
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    if (nextMuted) {
      // 记录静音前的音量
      prevVolumeRef.current = volume > 0 ? volume : prevVolumeRef.current || initialVolume;
      onChange?.(0);
    } else {
      // 恢复静音前的音量
      const restoreVolume = prevVolumeRef.current > 0 ? prevVolumeRef.current : initialVolume;
      setVolume(restoreVolume);
      onChange?.(restoreVolume);
    }
  };

  // 点击外部关闭 (仅针对弹窗模式生效)
  useEffect(() => {
    if (variant !== "popup") return;

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [variant]);

  useEffect(() => {
    setVolume(initialVolume);
  }, [initialVolume]);

  // 组件卸载时清理定时器，防止内存泄漏
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // 🟢 形态 1：常驻内联模式 (推荐在 Tray 中使用)
  if (variant === "inline") {
    return (
      <div
        onWheel={handleWheel}
        className="flex items-center w-full gap-3 px-4 py-2 hover:bg-white/5 transition-colors rounded-md min-w-0 select-none"
      >
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
          {isMuted ? 0 : Math.round(volume)}%
        </span>
      </div>
    );
  }

  // 🟢 形态 2：悬浮弹窗模式 (推荐在 PlayerBar 中使用)
  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      className={`relative flex items-center justify-center select-none ${className}`}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button
        onClick={handleMuteToggle}
        className="text-[#b3b3b3] hover:text-white transition-colors"
      >
        {getVolumeIcon()}
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 pb-2 z-50">
          <div className="bg-zinc-900 rounded-lg p-3 shadow-xl border border-zinc-700">
            <div className="flex flex-col items-center gap-2 mt-2">
              <SmoothSlider
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                orientation={orientation}
                size={120}
                trackThickness={5}
                thumbSize={10}
                thumbOnHover={false}
              />
              <span className="text-xs text-white font-medium tabular-nums w-[4ch] inline-block text-center">
                {isMuted ? 0 : Math.round(volume)}%
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
