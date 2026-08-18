"use client";

import { Volume, Volume1, Volume2, VolumeOff } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useI18n } from "@/store/module/i18n";
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
  const { t } = useI18n();
  const [volume, setVolume] = useState(initialVolume);
  const [isMuted, setMuted] = useState(false);
  const prevVolumeRef = useRef<number>(initialVolume);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const getVolumeIcon = () => {
    if (isMuted || volume === 0) {
      return <VolumeOff className="size-5" />;
    } else if (volume < 33) {
      return <Volume className="size-5" />;
    } else if (volume < 66) {
      return <Volume1 className="size-5" />;
    } else {
      return <Volume2 className="size-5" />;
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

      onChange?.(roundedVolume);
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

  const volumeLabel = isMuted ? t("ui.unmute") : `${t("ui.volume")}: ${Math.round(volume)}%`;

  // 点击外部及 ESC 键关闭 (仅针对弹窗模式生效)
  useEffect(() => {
    if (variant !== "popup") return;

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [variant]);

  useEffect(() => {
    setVolume(initialVolume);
  }, [initialVolume]);

  // 🟢 形态 1：常驻内联模式 (推荐在 Tray 中使用)
  if (variant === "inline") {
    return (
      <div
        data-shortcut-scope="volume"
        onWheel={handleWheel}
        className="hover:bg-accent flex w-full min-w-0 items-center gap-3 rounded-md px-4 py-2 transition-colors select-none"
      >
        <button
          type="button"
          aria-label={volumeLabel}
          onClick={handleMuteToggle}
          className="text-content-muted hover:text-content shrink-0 transition-colors"
        >
          {getVolumeIcon()}
        </button>
        <div className="flex min-w-12.5 flex-1 items-center">
          <SmoothSlider
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            orientation={orientation}
            trackThickness={4}
            thumbSize={12}
            thumbOnHover={true}
          />
        </div>
        <span className="text-content-muted w-8 shrink-0 text-right text-xs font-medium tabular-nums">
          {isMuted ? 0 : Math.round(volume)}%
        </span>
      </div>
    );
  }

  // 🟢 形态 2：悬浮弹窗模式 (推荐在 PlayerBar 中使用)
  return (
    <div
      ref={containerRef}
      data-shortcut-scope="volume"
      onWheel={handleWheel}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
      className={`relative flex items-center justify-center select-none ${className}`}
    >
      <button
        type="button"
        aria-label={volumeLabel}
        onClick={handleMuteToggle}
        className="text-content-muted hover:text-content transition-colors"
      >
        {getVolumeIcon()}
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-1/2 z-50 -translate-x-1/2 pb-2">
          <div className="border-border bg-surface-overlay shadow-floating rounded-lg border p-3">
            <div className="mt-2 flex flex-col items-center gap-2">
              <SmoothSlider
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                orientation={orientation}
                size={120}
                trackThickness={5}
                thumbSize={10}
                thumbOnHover={false}
              />
              <span className="text-content inline-block w-[4ch] text-center text-xs font-medium tabular-nums">
                {isMuted ? 0 : Math.round(volume)}%
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
