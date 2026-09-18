"use client";

import { Volume, Volume1, Volume2, VolumeOff } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { SmoothSlider } from "@/components/shared/SmoothSlider";
import { useI18n } from "@/store/module/i18n";

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

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, variant]);

  // 同步外部 initialVolume 变化
  useEffect(() => {
    setVolume(Math.round(initialVolume));
    if (initialVolume > 0 && isMuted) {
      setMuted(false);
    }
  }, [initialVolume, isMuted]);

  // 1. 内联渲染模式 (Inline)
  if (variant === "inline") {
    return (
      <div
        className={`flex items-center gap-3 ${className}`}
        onWheel={handleWheel}
        title={t("shortcuts.scope.volume")}
      >
        <button
          onClick={handleMuteToggle}
          className="text-muted-foreground transition-colors hover:text-foreground"
          aria-label={volumeLabel}
        >
          {getVolumeIcon()}
        </button>

        <div className={orientation === "horizontal" ? "w-24" : "h-24"}>
          <SmoothSlider
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            orientation={orientation}
            size="sm"
            ariaLabel={t("ui.volume")}
          />
        </div>
      </div>
    );
  }

  // 2. 弹窗渲染模式 (Popup)
  return (
    <div
      ref={containerRef}
      className={`relative flex items-center justify-center ${className}`}
      onWheel={handleWheel}
      title={t("shortcuts.scope.volume")}
    >
      {/* 图标触发按钮 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="cursor-pointer text-content-muted transition-colors hover:text-content"
        aria-label={volumeLabel}
      >
        {getVolumeIcon()}
      </button>

      {/* 弹出的音量条气泡 (Pop-over) */}
      {isOpen && (
        <div
          className={`absolute bottom-full mb-3 flex animate-in flex-col items-center rounded-xl border border-border bg-surface p-3 shadow-panel backdrop-blur-md transition-all fade-in-0 zoom-in-95 ${
            orientation === "vertical" ? "h-40 w-11" : "h-11 w-40"
          }`}
          style={{ zIndex: 60 }}
        >
          {/* 静音快速切换按键 */}
          <button
            onClick={handleMuteToggle}
            className="mb-2 text-content-muted transition-colors hover:text-content"
            aria-label={volumeLabel}
          >
            {getVolumeIcon()}
          </button>

          {/* 音量滑块 */}
          <div className="flex flex-1 items-center justify-center">
            <SmoothSlider
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              orientation={orientation}
              size="sm"
              ariaLabel={t("ui.volume")}
            />
          </div>

          {/* 底部三角形小气泡指示箭头 */}
          <div className="absolute top-full left-1/2 size-0 -translate-x-1/2 border-x-4 border-t-4 border-x-transparent border-t-surface" />
        </div>
      )}
    </div>
  );
};

export default VolumeControl;
