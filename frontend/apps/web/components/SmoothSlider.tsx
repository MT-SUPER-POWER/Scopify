"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ProgressRangeMarkers } from "@/components/shared/ProgressRangeMarkers";
import type { SmoothSliderProps } from "@/types/components/slider";

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
  rangeMarkers = [],
  markerAppearance = "pin",
  markerColor = "rgba(30, 215, 96, 0.85)",
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
      className={`relative flex touch-none items-center justify-center select-none ${className}`}
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
        className="relative flex w-full cursor-pointer items-center justify-center rounded-full"
        style={{
          backgroundColor: trackColor,
          ...(isVertical
            ? { width: trackThickness, height: "100%" }
            : { height: trackThickness, width: "100%" }),
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        {/* 缓冲层：clip-path 不会像 scale 一样压扁胶囊两端的圆角 */}
        <div
          className="pointer-events-none absolute rounded-full"
          style={{
            backgroundColor: bufferedColor,
            transition: "clip-path 0.25s linear", // 缓冲进度更新慢，可以保留 transition
            willChange: "clip-path",
            ...(isVertical
              ? {
                  width: "100%",
                  height: "100%",
                  bottom: 0,
                  left: 0,
                  clipPath: `inset(${(1 - scaleBuffered) * 100}% 0 0 0 round 999px)`,
                }
              : {
                  height: "100%",
                  width: "100%",
                  top: 0,
                  left: 0,
                  clipPath: `inset(0 ${(1 - scaleBuffered) * 100}% 0 0 round 999px)`,
                }),
          }}
        />

        {/* 进度层：去除高频 transition 打架问题，并保留圆润端点 */}
        <div
          className="pointer-events-none absolute rounded-full"
          style={{
            backgroundColor: currentFillColor,
            transition: isDragging ? "none" : "background-color 0.2s", // ⚠️ 彻底砍掉进度的过渡动画
            willChange: "clip-path",
            ...(isVertical
              ? {
                  width: "100%",
                  height: "100%",
                  bottom: 0,
                  left: 0,
                  clipPath: `inset(${(1 - scaleValue) * 100}% 0 0 0 round 999px)`,
                }
              : {
                  height: "100%",
                  width: "100%",
                  top: 0,
                  left: 0,
                  clipPath: `inset(0 ${(1 - scaleValue) * 100}% 0 0 round 999px)`,
                }),
          }}
        />

        <ProgressRangeMarkers
          appearance={markerAppearance}
          color={markerColor}
          orientation={orientation}
          ranges={rangeMarkers}
        />
      </div>

      {/* 滑块：可拖动，体验与轨道一致 */}
      <div
        className="absolute z-10 cursor-pointer rounded-full shadow-md"
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
