"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ProgressRangeMarkers } from "@/components/shared/ProgressRangeMarkers";
import type { SmoothSliderProps } from "@/types/components/slider";

export const SmoothSlider = ({
  ariaLabel,
  ariaValueText,
  value,
  bufferedValue = 0,
  disabled = false,
  onChange,
  orientation = "horizontal",
  size = "100%",
  trackColor = "var(--input)",
  bufferedColor = "var(--skeleton)",
  fillColor = "var(--content)",
  thumbColor = "var(--content)",
  hoverFillColor = "var(--brand)",
  showThumb = true,
  thumbOnHover = true,
  trackThickness = 4,
  thumbSize = 12,
  rangeMarkers = [],
  markerAppearance = "pin",
  markerColor = "var(--brand)",
  className = "",
}: SmoothSliderProps) => {
  const [isHovering, setIsHovering] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const latestValueRef = useRef(value);

  const isVertical = orientation === "vertical";

  // 将 0-100 的百分比转换为 0.0 - 1.0 的小数
  const scaleValue = Math.max(0, Math.min(100, value)) / 100;
  const scaleBuffered = Math.max(0, Math.min(100, bufferedValue)) / 100;

  const calculateValue = useCallback(
    (clientX: number, clientY: number) => {
      if (disabled || !trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      let percent: number;

      if (isVertical) {
        percent = ((rect.bottom - clientY) / rect.height) * 100;
      } else {
        percent = ((clientX - rect.left) / rect.width) * 100;
      }

      const nextValue = Math.max(0, Math.min(100, percent));
      latestValueRef.current = nextValue;
      onChange(nextValue, false);
    },
    [disabled, isVertical, onChange],
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (disabled) return;
      setIsDragging(true);
      calculateValue(e.clientX, e.clientY);
    },
    [calculateValue, disabled],
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
    onChange(latestValueRef.current, true);
  }, [onChange]);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (disabled) return;
      setIsDragging(true);
      calculateValue(e.touches[0].clientX, e.touches[0].clientY);
    },
    [calculateValue, disabled],
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (disabled) return;
      const step = event.shiftKey ? 5 : 1;
      let nextValue: number | null = null;

      if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
        nextValue = value - step;
      } else if (event.key === "ArrowRight" || event.key === "ArrowUp") {
        nextValue = value + step;
      } else if (event.key === "Home") {
        nextValue = 0;
      } else if (event.key === "End") {
        nextValue = 100;
      }

      if (nextValue === null) return;
      event.preventDefault();
      const clampedValue = Math.max(0, Math.min(100, nextValue));
      latestValueRef.current = clampedValue;
      onChange(clampedValue, true);
    },
    [disabled, onChange, value],
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
    onChange(latestValueRef.current, true);
  }, [onChange]);

  useEffect(() => {
    if (!isDragging) latestValueRef.current = Math.max(0, Math.min(100, value));
  }, [isDragging, value]);

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
      aria-disabled={disabled}
      aria-label={ariaLabel}
      aria-valuemax={100}
      aria-valuemin={0}
      aria-valuenow={Math.round(Math.max(0, Math.min(100, value)))}
      aria-valuetext={ariaValueText}
      className={`relative flex touch-none items-center justify-center select-none ${disabled ? "pointer-events-none opacity-45" : ""} ${className}`}
      onKeyDown={handleKeyDown}
      role={ariaLabel ? "slider" : undefined}
      style={{
        ...(isVertical
          ? { height: size, width: thumbSize, flexDirection: "column" }
          : { width: size, height: thumbSize }),
      }}
      tabIndex={ariaLabel ? (disabled ? -1 : 0) : undefined}
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
