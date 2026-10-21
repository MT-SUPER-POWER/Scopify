"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { TransitionEvent } from "react";
import type { DynamicIslandContent, DynamicIslandTransition } from "@/types/dynamicIsland";

/** 收缩动画时长加一点余量：窗口在后台时 transitionend 可能不触发，到点强制换行。 */
const SHRINK_FALLBACK_MS = 400;

/**
 * 灵动岛换行动画。bounce：歌词槽先收到 0 并淡出，换上新内容后带回弹地展开到新宽度；
 * smooth：直接朝新宽度过渡，新内容由视图层做向上翻入。
 * 同一行内（key 不变）的逐字进度始终取最新值，不触发动画。
 */
export function useIslandLyricTransition(
  content: DynamicIslandContent,
  transition: DynamicIslandTransition,
) {
  const [shown, setShown] = useState(content);
  const [shrinking, setShrinking] = useState(false);
  const latestRef = useRef(content);
  latestRef.current = content;

  const lineChanged = content.key !== shown.key;
  if (lineChanged && !shrinking) {
    // 渲染期间根据上一次展示的内容推导状态，避免多渲染一帧旧宽度。
    if (transition === "smooth") setShown(content);
    else setShrinking(true);
  }

  const finishShrink = useCallback(() => {
    setShown(latestRef.current);
    setShrinking(false);
  }, []);

  useEffect(() => {
    if (!shrinking) return;
    const timer = window.setTimeout(finishShrink, SHRINK_FALLBACK_MS);
    return () => window.clearTimeout(timer);
  }, [finishShrink, shrinking]);

  const onTransitionEnd = useCallback(
    (event: TransitionEvent<HTMLElement>) => {
      if (event.propertyName === "width" && event.target === event.currentTarget && shrinking) {
        finishShrink();
      }
    },
    [finishShrink, shrinking],
  );

  return {
    /** 当前展示的内容；同一行时带最新逐字进度。 */
    shown: content.key === shown.key ? content : shown,
    shrinking,
    onTransitionEnd,
  };
}
