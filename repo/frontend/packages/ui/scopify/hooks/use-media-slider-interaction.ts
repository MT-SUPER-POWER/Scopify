"use client";

import {
  type KeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type TouchEvent as ReactTouchEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

interface UseMediaSliderInteractionOptions {
  disabled: boolean;
  isVertical: boolean;
  onChange: (value: number, isCommit: boolean) => void;
  value: number;
}

export function useMediaSliderInteraction({
  disabled,
  isVertical,
  onChange,
  value,
}: UseMediaSliderInteractionOptions) {
  const [isDragging, setIsDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const latestValueRef = useRef(value);

  const calculateValue = useCallback(
    (clientX: number, clientY: number) => {
      if (disabled || !trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      const percent = isVertical
        ? ((rect.bottom - clientY) / rect.height) * 100
        : ((clientX - rect.left) / rect.width) * 100;
      const nextValue = Math.max(0, Math.min(100, percent));

      latestValueRef.current = nextValue;
      onChange(nextValue, false);
    },
    [disabled, isVertical, onChange],
  );

  const handleMouseDown = useCallback(
    (event: ReactMouseEvent) => {
      if (disabled) return;
      setIsDragging(true);
      calculateValue(event.clientX, event.clientY);
    },
    [calculateValue, disabled],
  );

  const handleTouchStart = useCallback(
    (event: ReactTouchEvent) => {
      if (disabled || event.touches.length === 0) return;
      setIsDragging(true);
      calculateValue(event.touches[0].clientX, event.touches[0].clientY);
    },
    [calculateValue, disabled],
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (disabled) return;
      const step = event.shiftKey ? 5 : 1;
      let nextValue: number | null = null;

      if (event.key === "ArrowLeft" || event.key === "ArrowDown") nextValue = value - step;
      if (event.key === "ArrowRight" || event.key === "ArrowUp") nextValue = value + step;
      if (event.key === "Home") nextValue = 0;
      if (event.key === "End") nextValue = 100;
      if (nextValue === null) return;

      event.preventDefault();
      const clampedValue = Math.max(0, Math.min(100, nextValue));
      latestValueRef.current = clampedValue;
      onChange(clampedValue, true);
    },
    [disabled, onChange, value],
  );

  useEffect(() => {
    if (!isDragging) latestValueRef.current = Math.max(0, Math.min(100, value));
  }, [isDragging, value]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (event: MouseEvent) => calculateValue(event.clientX, event.clientY);
    const handleTouchMove = (event: TouchEvent) => {
      if (event.touches.length > 0) {
        calculateValue(event.touches[0].clientX, event.touches[0].clientY);
      }
    };
    const handleInteractionEnd = () => {
      setIsDragging(false);
      onChange(latestValueRef.current, true);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleInteractionEnd);
    document.addEventListener("touchmove", handleTouchMove);
    document.addEventListener("touchend", handleInteractionEnd);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleInteractionEnd);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleInteractionEnd);
    };
  }, [calculateValue, isDragging, onChange]);

  return {
    handleKeyDown,
    handleMouseDown,
    handleTouchStart,
    isDragging,
    trackRef,
  };
}
