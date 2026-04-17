"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface SmoothSliderProps {
  value: number; // 0-100
  bufferedValue?: number; // 0-100
  onChange: (value: number, isCommit: boolean) => void;
  orientation?: "horizontal" | "vertical";
  size?: number | string;
  trackColor?: string;
  bufferedColor?: string;
  fillColor?: string;
  thumbColor?: string;
  hoverFillColor?: string;
  showThumb?: boolean;
  thumbOnHover?: boolean;
  trackThickness?: number;
  thumbSize?: number;
  className?: string;
}

export const SmoothSlider = ({
  value,
  bufferedValue = 0,
  onChange,
  orientation = "horizontal",
  size = "100%",
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

  // 将 0-100 的百分比转换为 0.0 - 1.0 的小数
  const scaleValue = Math.max(0, Math.min(100, value)) / 100;
  const scaleBuffered = Math.max(0, Math.min(100, bufferedValue)) / 100;

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

      onChange(Math.max(0, Math.min(100, percent)), false);
    },
    [isVertical, onChange],
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      setIsDragging(true);
      calculateValue(e.clientX, e.clientY);
    },
    [calculateValue],
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;
      calculateValue(e.clientX, e.clientY);
    },
    [isDragging, calculateValue],
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    if (trackRef.current) {
      // 取最后一次鼠标位置
      onChange(Math.max(0, Math.min(100, value)), true);
    }
  }, [onChange, value]);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      setIsDragging(true);
      calculateValue(e.touches[0].clientX, e.touches[0].clientY);
    },
    [calculateValue],
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isDragging || e.touches.length === 0) return;
      calculateValue(e.touches[0].clientX, e.touches[0].clientY);
    },
    [isDragging, calculateValue],
  );

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    onChange(Math.max(0, Math.min(100, value)), true);
  }, [onChange, value]);

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
          ? { height: size, width: thumbSize, flexDirection: "column" }
          : { width: size, height: thumbSize }),
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
        {/* 缓冲层：使用 transform: scale 替代 width/height，触发 GPU 加速 */}
        <div
          className="absolute rounded-full pointer-events-none will-change-transform"
          style={{
            backgroundColor: bufferedColor,
            transformOrigin: isVertical ? "bottom center" : "left center",
            transition: "transform 0.25s linear", // 缓冲进度更新慢，可以保留 transition
            ...(isVertical
              ? {
                  width: "100%",
                  height: "100%",
                  bottom: 0,
                  left: 0,
                  transform: `scaleY(${scaleBuffered})`,
                }
              : {
                  height: "100%",
                  width: "100%",
                  top: 0,
                  left: 0,
                  transform: `scaleX(${scaleBuffered})`,
                }),
          }}
        />

        {/* 进度层：去除高频 transition 打架问题，使用 transform */}
        <div
          className="absolute rounded-full pointer-events-none will-change-transform"
          style={{
            backgroundColor: currentFillColor,
            transformOrigin: isVertical ? "bottom center" : "left center",
            transition: isDragging ? "none" : "background-color 0.2s", // ⚠️ 彻底砍掉 transform/width 的过渡动画
            ...(isVertical
              ? {
                  width: "100%",
                  height: "100%",
                  bottom: 0,
                  left: 0,
                  transform: `scaleY(${scaleValue})`,
                }
              : {
                  height: "100%",
                  width: "100%",
                  top: 0,
                  left: 0,
                  transform: `scaleX(${scaleValue})`,
                }),
          }}
        />
      </div>

      {/* 滑块：可拖动，体验与轨道一致 */}
      <div
        className="absolute rounded-full shadow-md z-10 cursor-pointer"
        style={{
          width: thumbSize,
          height: thumbSize,
          backgroundColor: thumbColor,
          transition: "opacity 0.2s, transform 0.2s",
          opacity: isThumbVisible ? 1 : 0,
          ...(isVertical
            ? {
                left: `calc(50% - ${thumbSize / 2}px)`,
                bottom: `calc(${value}% - ${thumbSize / 2}px)`,
                transform: isThumbVisible ? "scale(1)" : "scale(0)",
              }
            : {
                top: `calc(50% - ${thumbSize / 2}px)`,
                left: `calc(${value}% - ${thumbSize / 2}px)`,
                transform: isThumbVisible ? "scale(1)" : "scale(0)",
              }),
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      />
    </div>
  );
};
