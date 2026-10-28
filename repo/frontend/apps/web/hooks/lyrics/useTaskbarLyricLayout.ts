"use client";

import { useEffect, useState } from "react";
import { runtime } from "@/lib/runtime";
import type { TaskbarLyricLayout } from "@/types/desktop/taskbarLyric";

/** 任务栏布局（可用宽度、贴靠方向、深浅色）由主进程在任务栏变化时推送。 */
export function useTaskbarLyricLayout() {
  const [layout, setLayout] = useState<TaskbarLyricLayout | null>(null);

  useEffect(() => {
    let active = true;
    let received = false;
    const unsubscribe = runtime.taskbarLyric.onLayoutChanged((next) => {
      received = true;
      setLayout(next);
    });
    void runtime.taskbarLyric.getLayout().then((next) => {
      if (active && !received && next) setLayout(next);
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  return layout;
}
