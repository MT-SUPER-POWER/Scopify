"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, useSpring, useTransform } from "motion/react";

interface SmoothSliderProps {
  /** 当前值 0-100 */
  value: number;
  /** 值改变时的回调 */
  onChange: (value: number) => void;
  /** 方向：水平或垂直 */
  orientation?: "horizontal" | "vertical";
  /** 自定义高度（垂直模式）或宽度（水平模式） */
  size?: number;
  /** 滑轨颜色 */
  trackColor?: string;
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
  onChange,
  orientation = "horizontal",
  size = 150, // 默认固定尺寸，当传入外层 flex 时可通过设置 style/class 覆盖
  trackColor = "#4d4d4d",
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

  // 使用 spring 动画让值变化更丝滑
  const springValue = useSpring(value, {
    stiffness: 300,
    damping: 30,
  });

  // 当外部 value 改变时更新 spring
  useEffect(() => {
    springValue.set(value);
  }, [value, springValue]);

  // 计算填充百分比
  const fillPercent = useTransform(springValue, [0, 100], ["0%", "100%"]);

  // 根据鼠标/触摸位置计算值
  const calculateValue = useCallback(
    (clientX: number, clientY: number) => {
      if (!trackRef.current) return;

      const rect = trackRef.current.getBoundingClientRect();
      let percent: number;

      if (isVertical) {
        // 垂直方向：从下到上
        percent = ((rect.bottom - clientY) / rect.height) * 100;
      } else {
        // 水平方向：从左到右
        percent = ((clientX - rect.left) / rect.width) * 100;
      }

      const clampedValue = Math.max(0, Math.min(100, Math.round(percent)));
      onChange(clampedValue);
    },
    [isVertical, onChange]
  );

  // 鼠标事件处理
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

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // 触摸事件处理
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      setIsDragging(true);
      const touch = e.touches[0];
      calculateValue(touch.clientX, touch.clientY);
    },
    [calculateValue]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isDragging || e.touches.length === 0) return;
      const touch = e.touches[0];
      calculateValue(touch.clientX, touch.clientY);
    },
    [isDragging, calculateValue]
  );

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // 全局事件监听
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

  // 计算当前填充颜色
  const currentFillColor = isHovering || isDragging ? hoverFillColor : fillColor;

  // 滑块是否可见
  const isThumbVisible = showThumb && (thumbOnHover ? isHovering || isDragging : true);

  return (
    <div
      className={`relative flex justify-center items-center select-none touch-none ${className}`}
      style={{
        ...(isVertical
          ? { height: size !== undefined ? size : "100%", width: thumbSize, flexDirection: "column" }
          : { width: "100%", height: thumbSize }),  // 水平模式直接沾满容器，由外层 className 控制 flex-1
      }}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* 滑轨 */}
      <div
        ref={trackRef}
        className="relative rounded-full cursor-pointer w-full flex items-center justify-center"
        style={{
          backgroundColor: trackColor,
          ...(isVertical
            ? { width: trackThickness, height: "100%" }
            : { height: trackThickness, width: "100%" }),
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        {/* 填充 */}
        <motion.div
          className="absolute rounded-full"
          style={{
            backgroundColor: currentFillColor,
            ...(isVertical
              ? {
                width: "100%",
                height: fillPercent,
                bottom: 0,
                left: 0,
              }
              : {
                height: "100%",
                width: fillPercent,
                top: 0,
                left: 0,
              }),
            transition: isDragging ? "none" : "background-color 0.2s",
          }}
        />

        {/* 滑块 */}
        <motion.div
          className="absolute rounded-full shadow-md z-10"
          style={{
            width: thumbSize,
            height: thumbSize,
            backgroundColor: thumbColor,
            cursor: isDragging ? "grabbing" : "grab",
            ...(isVertical
              ? {
                left: "50%",
                x: "-50%",
                bottom: fillPercent,
                y: "50%",
              }
              : {
                top: "50%",
                y: "-50%",
                left: fillPercent,
                x: "-50%",
              }),
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{
            scale: isThumbVisible ? 1 : 0,
            opacity: isThumbVisible ? 1 : 0,
          }}
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.9 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        />
      </div>
    </div>
  );
};
