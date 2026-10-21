"use client";

import { useEffect, useState } from "react";
import { runtime } from "@/lib/runtime";
import type { DynamicIslandMode } from "@/types/dynamicIsland";

/** 吸附/悬浮形态由主进程在拖拽中实时判定，渲染端据此切换圆角。 */
export function useDynamicIslandMode() {
  const [mode, setMode] = useState<DynamicIslandMode>("snapped");

  useEffect(() => {
    let active = true;
    let received = false;
    const unsubscribe = runtime.dynamicIsland.onModeChanged((next) => {
      received = true;
      setMode(next);
    });
    void runtime.dynamicIsland.getMode().then((next) => {
      if (active && !received) setMode(next);
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  return mode;
}
