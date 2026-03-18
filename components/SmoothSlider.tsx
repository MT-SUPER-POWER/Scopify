"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion } from "framer-motion";

interface SmoothSliderProps {
  /** 当前值 0-100 */
  value: number;
  /** 缓冲值 0-100 */
  bufferedValue?: number;
  /** 值改变时的回调 */
  onChange: (value: number) => void;
  /** 方向：水平或垂直 */
  orientation?: "horizontal" | "vertical";
  /** 自定义高度（垂直模式）或宽度（水平模式） */
  size?: number;
  /** 滑轨颜色 */
  trackColor?: string;
  /** 缓冲颜色 */
  bufferedColor?: string;
  /** 填充颜色 */
  fillColor?: string;
  /** 滑块颜色 */
  thumbColor?: string;
  /** hover 时填充颜色 */
  hoverFillColor?: string;
  /** 是否显示滑块 */
  showThumb?: boolean;
  /** 只在 hover 时显示滑块 */
  thumbOnHover?: boolean;
  /** 滑轨粗细 */
  trackThickness?: number;
  /** 滑块大小 */
  thumbSize?: number;
  /** 自定义类名 */
  className?: string;
}

export const SmoothSlider = ({
  value,
  bufferedValue = 0,
  onChange,
  orientation = "horizontal",
  size = 150,
  trackColor = "#4d4d4d",
  bufferedColor = "rgba(255, 255, 255, 0.3)",
  fillColor = "#ffffff",
  thumbColor = "#ffffff",
  hoverFillColor = "#1db954",
  showThumb = true,
  thumbOnHover = true,
  trackThickness = 4,
  thumbSize = 12,
  className = "",
}: SmoothSliderProps) => {
  const [isHovering, setIsHovering] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  const isVertical = orientation === "vertical";

  // 优化 1：保留小数精度，防止歌曲进度条产生“跳帧”的顿挫感
  const fillPercent = `${value}%`;
  const bufferedPercent = `${bufferedValue}%`;

  const calculateValue = useCallback(
    (clientX: number, clientY: number) => {
      if (!trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      let percent: number;

      if (isVertical) {
        percent = ((rect.bottom - clientY) / rect.height) * 100;
      } else {
        percent = ((clientX - rect.left) / rect.width) * 100;
      }

      // 优化 2：移除 Math.round()，保留精度，让拖拽和进度反馈更丝滑
      const clampedValue = Math.max(0, Math.min(100, percent));
      onChange(clampedValue);
    },
    [isVertical, onChange]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      setIsDragging(true);
      calculateValue(e.clientX, e.clientY);
    },
    [calculateValue]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;
      calculateValue(e.clientX, e.clientY);
    },
    [isDragging, calculateValue]
  );

  const handleMouseUp = useCallback(() => setIsDragging(false), []);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      setIsDragging(true);
      calculateValue(e.touches[0].clientX, e.touches[0].clientY);
    },
    [calculateValue]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isDragging || e.touches.length === 0) return;
      calculateValue(e.touches[0].clientX, e.touches[0].clientY);
    },
    [isDragging, calculateValue]
  );

  const handleTouchEnd = useCallback(() => setIsDragging(false), []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.addEventListener("touchmove", handleTouchMove);
      document.addEventListener("touchend", handleTouchEnd);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.removeEventListener("touchmove", handleTouchMove);
        document.removeEventListener("touchend", handleTouchEnd);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

  const currentFillColor = isHovering || isDragging ? hoverFillColor : fillColor;
  const isThumbVisible = showThumb && (thumbOnHover ? isHovering || isDragging : true);

  return (
    <div
      className={`relative flex justify-center items-center select-none touch-none ${className}`}
      style={{
        ...(isVertical
          ? { height: size !== undefined ? size : "100%", width: thumbSize, flexDirection: "column" }
          : { width: "100%", height: thumbSize }),
      }}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div
        ref={trackRef}
        className="relative rounded-full cursor-pointer w-full flex items-center justify-center overflow-hidden"
        style={{
          backgroundColor: trackColor,
          ...(isVertical
            ? { width: trackThickness, height: "100%" }
            : { height: trackThickness, width: "100%" }),
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        <div
          className="absolute rounded-full"
          style={{
            backgroundColor: bufferedColor,
            transition: "width 0.25s linear, height 0.25s linear",
            ...(isVertical
              ? { width: "100%", height: bufferedPercent, bottom: 0, left: 0 }
              : { height: "100%", width: bufferedPercent, top: 0, left: 0 }),
          }}
        />

        <div
          className="absolute rounded-full"
          style={{
            backgroundColor: currentFillColor,
            transition: isDragging ? "none" : "width 0.25s linear, height 0.25s linear, background-color 0.2s",
            ...(isVertical
              ? { width: "100%", height: fillPercent, bottom: 0, left: 0 }
              : { height: "100%", width: fillPercent, top: 0, left: 0 }),
          }}
        />
      </div>

      {/* 修复：移除 transform，改用 calc 减去半径来实现严格的几何居中 */}
      <motion.div
        className="absolute rounded-full shadow-md z-10 pointer-events-none"
        style={{
          width: thumbSize,
          height: thumbSize,
          backgroundColor: thumbColor,
          transition: isDragging ? "none" : "left 0.25s linear, bottom 0.25s linear",
          ...(isVertical
            ? {
              left: `calc(50% - ${thumbSize / 2}px)`,
              bottom: `calc(${fillPercent} - ${thumbSize / 2}px)`
            }
            : {
              top: `calc(50% - ${thumbSize / 2}px)`,
              left: `calc(${fillPercent} - ${thumbSize / 2}px)`
            }),
        }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{
          scale: isThumbVisible ? 1 : 0,
          opacity: isThumbVisible ? 1 : 0,
        }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      />
    </div>
  );
};
