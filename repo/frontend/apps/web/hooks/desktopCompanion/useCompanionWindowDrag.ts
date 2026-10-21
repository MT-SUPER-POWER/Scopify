"use client";

import { useCallback, useEffect, useRef } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import type { CompanionWindowDragOptions } from "@/types/desktopCompanion";

/** 留给系统原生拖边缩放的边缘宽度。 */
const RESIZE_BORDER_WIDTH = 8;

/**
 * 透明无边框窗口的自定义拖拽：不用 -webkit-app-region，否则拖拽区会吞掉悬停和点击事件。
 * 用指针在窗口内的偏移换算目标位置，不缓存窗口坐标，避开高 DPI 下的取整漂移；
 * 指针捕获保证拖出窗口后仍能持续收到事件，rAF 合并移动以降低 IPC 频率。
 */
export function useCompanionWindowDrag({
  disabled,
  ignoreSelector = "button, a, input, [data-no-drag]",
  onMove,
  onEnd,
}: CompanionWindowDragOptions) {
  const optionsRef = useRef({ disabled, ignoreSelector, onMove, onEnd });
  optionsRef.current = { disabled, ignoreSelector, onMove, onEnd };
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => () => cleanupRef.current?.(), []);

  return useCallback((event: ReactPointerEvent<HTMLElement>) => {
    const options = optionsRef.current;
    if (options.disabled || event.button !== 0) return;
    const inResizeBorder =
      event.clientX <= RESIZE_BORDER_WIDTH ||
      event.clientX >= window.innerWidth - RESIZE_BORDER_WIDTH ||
      event.clientY <= RESIZE_BORDER_WIDTH ||
      event.clientY >= window.innerHeight - RESIZE_BORDER_WIDTH;
    const target = event.target as HTMLElement;
    if (inResizeBorder || target.closest(options.ignoreSelector)) return;

    cleanupRef.current?.();
    const element = event.currentTarget;
    const pointerId = event.pointerId;
    const offsetX = event.clientX;
    const offsetY = event.clientY;
    let frame = 0;
    let pending: { x: number; y: number } | null = null;

    const flush = () => {
      frame = 0;
      if (pending) optionsRef.current.onMove(pending.x, pending.y);
      pending = null;
    };
    const move = (moveEvent: PointerEvent) => {
      pending = {
        x: Math.round(moveEvent.screenX - offsetX),
        y: Math.round(moveEvent.screenY - offsetY),
      };
      frame ||= requestAnimationFrame(flush);
    };
    const cleanup = () => {
      cancelAnimationFrame(frame);
      element.removeEventListener("pointermove", move);
      element.removeEventListener("pointerup", end);
      element.removeEventListener("pointercancel", end);
      if (element.hasPointerCapture(pointerId)) element.releasePointerCapture(pointerId);
      cleanupRef.current = null;
    };
    const end = () => {
      if (frame) flush();
      cleanup();
      optionsRef.current.onEnd();
    };

    element.setPointerCapture(pointerId);
    element.addEventListener("pointermove", move);
    element.addEventListener("pointerup", end);
    element.addEventListener("pointercancel", end);
    cleanupRef.current = cleanup;
    event.preventDefault();
  }, []);
}
