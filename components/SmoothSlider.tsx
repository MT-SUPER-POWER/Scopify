"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, useSpring, useTransform } from "motion/react";

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
  bufferedColor = "rgba(255, 255, 255, 0.3)", // 默认半透明白色
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

  // 播放进度弹簧动画
  const springValue = useSpring(value, { stiffness: 300, damping: 30 });
  // 缓冲进度弹簧动画（保持视觉一致性）
  const springBuffered = useSpring(bufferedValue, { stiffness: 300, damping: 30 });

  useEffect(() => {
    springValue.set(value);
  }, [value, springValue]);

  useEffect(() => {
    springBuffered.set(bufferedValue);
  }, [bufferedValue, springBuffered]);

  const fillPercent = useTransform(springValue, [0, 100], ["0%", "100%"]);
  const bufferedPercent = useTransform(springBuffered, [0, 100], ["0%", "100%"]);

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

      const clampedValue = Math.max(0, Math.min(100, Math.round(percent)));
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
      {/* 滑轨底色 */}
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
        {/* 缓冲进度层 (新增) */}
        <motion.div
          className="absolute rounded-full"
          style={{
            backgroundColor: bufferedColor,
            ...(isVertical
              ? { width: "100%", height: bufferedPercent, bottom: 0, left: 0 }
              : { height: "100%", width: bufferedPercent, top: 0, left: 0 }),
          }}
        />

        {/* 播放进度层 */}
        <motion.div
          className="absolute rounded-full"
          style={{
            backgroundColor: currentFillColor,
            ...(isVertical
              ? { width: "100%", height: fillPercent, bottom: 0, left: 0 }
              : { height: "100%", width: fillPercent, top: 0, left: 0 }),
            transition: isDragging ? "none" : "background-color 0.2s",
          }}
        />
      </div>

      {/* 滑块 (移出 overflow-hidden 容器以防止被裁切) */}
      <motion.div
        className="absolute rounded-full shadow-md z-10 pointer-events-none"
        style={{
          width: thumbSize,
          height: thumbSize,
          backgroundColor: thumbColor,
          ...(isVertical
            ? { left: "50%", x: "-50%", bottom: fillPercent, y: "50%" }
            : { top: "50%", y: "-50%", left: fillPercent, x: "-50%" }),
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
