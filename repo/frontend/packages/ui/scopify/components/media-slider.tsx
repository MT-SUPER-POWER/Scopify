"use client";

import { useState } from "react";

import { ProgressRangeMarkers } from "@scopify/ui/scopify/components/progress-range-markers";
import { useMediaSliderInteraction } from "@scopify/ui/scopify/hooks/use-media-slider-interaction";
import type { MediaSliderProps } from "@scopify/ui/scopify/types/media-slider";
import { cn } from "@scopify/ui/shadcn/lib/utils";

export type { MediaSliderProps } from "@scopify/ui/scopify/types/media-slider";

export function MediaSlider({
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
  className,
}: MediaSliderProps) {
  const [isHovering, setIsHovering] = useState(false);
  const isVertical = orientation === "vertical";
  const { handleKeyDown, handleMouseDown, handleTouchStart, isDragging, trackRef } =
    useMediaSliderInteraction({ disabled, isVertical, onChange, value });

  const clampedValue = Math.max(0, Math.min(100, value));
  const clampedBufferedValue = Math.max(0, Math.min(100, bufferedValue));
  const currentFillColor = isHovering || isDragging ? hoverFillColor : fillColor;
  const isThumbVisible = showThumb && (thumbOnHover ? isHovering || isDragging : true);

  return (
    <div
      aria-disabled={disabled}
      aria-label={ariaLabel}
      aria-valuemax={100}
      aria-valuemin={0}
      aria-valuenow={Math.round(clampedValue)}
      aria-valuetext={ariaValueText}
      className={cn(
        "relative flex touch-none items-center justify-center select-none",
        disabled && "pointer-events-none opacity-45",
        className,
      )}
      onKeyDown={handleKeyDown}
      role={ariaLabel ? "slider" : undefined}
      style={isVertical ? { height: size, width: thumbSize } : { height: thumbSize, width: size }}
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
            ? { height: "100%", width: trackThickness }
            : { height: trackThickness, width: "100%" }),
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        <div
          className="pointer-events-none absolute rounded-full"
          style={{
            backgroundColor: bufferedColor,
            transition: "clip-path 0.25s linear",
            willChange: "clip-path",
            ...(isVertical
              ? {
                  bottom: 0,
                  height: "100%",
                  left: 0,
                  width: "100%",
                  clipPath: `inset(${100 - clampedBufferedValue}% 0 0 0 round 999px)`,
                }
              : {
                  height: "100%",
                  left: 0,
                  top: 0,
                  width: "100%",
                  clipPath: `inset(0 ${100 - clampedBufferedValue}% 0 0 round 999px)`,
                }),
          }}
        />
        <div
          className="pointer-events-none absolute rounded-full"
          style={{
            backgroundColor: currentFillColor,
            transition: isDragging ? "none" : "background-color 0.2s",
            willChange: "clip-path",
            ...(isVertical
              ? {
                  bottom: 0,
                  height: "100%",
                  left: 0,
                  width: "100%",
                  clipPath: `inset(${100 - clampedValue}% 0 0 0 round 999px)`,
                }
              : {
                  height: "100%",
                  left: 0,
                  top: 0,
                  width: "100%",
                  clipPath: `inset(0 ${100 - clampedValue}% 0 0 round 999px)`,
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
      <div
        className="absolute z-10 cursor-pointer rounded-full shadow-md"
        style={{
          backgroundColor: thumbColor,
          height: thumbSize,
          opacity: isThumbVisible ? 1 : 0,
          transition: "opacity 0.2s, transform 0.2s",
          width: thumbSize,
          ...(isVertical
            ? {
                bottom: `calc(${clampedValue}% - ${thumbSize / 2}px)`,
                left: `calc(50% - ${thumbSize / 2}px)`,
                transform: isThumbVisible ? "scale(1)" : "scale(0)",
              }
            : {
                left: `calc(${clampedValue}% - ${thumbSize / 2}px)`,
                top: `calc(50% - ${thumbSize / 2}px)`,
                transform: isThumbVisible ? "scale(1)" : "scale(0)",
              }),
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      />
    </div>
  );
}
