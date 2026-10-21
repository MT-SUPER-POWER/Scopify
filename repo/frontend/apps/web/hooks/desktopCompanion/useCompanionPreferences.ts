"use client";

import { useEffect, useState } from "react";
import { runtime } from "@/lib/runtime";
import type { RuntimeUnsubscribe } from "@/lib/runtime/types";

/**
 * 读取并订阅某个伴随窗口的偏好。偏好可能在主窗口设置页、托盘或窗口自身被改动，
 * 主进程会广播给所有相关窗口，这里只负责跟随最新值。
 */
export function useCompanionPreferences<T>(
  get: () => Promise<T | null>,
  subscribe: (callback: (preferences: T) => void) => RuntimeUnsubscribe,
) {
  const [preferences, setPreferences] = useState<T | null>(null);

  useEffect(() => {
    if (!runtime.isDesktop) return;
    let active = true;
    const refresh = () => {
      void get().then((next) => {
        if (active && next) setPreferences(next);
      });
    };
    refresh();
    const unsubscribe = subscribe(setPreferences);
    window.addEventListener("focus", refresh);
    return () => {
      active = false;
      unsubscribe();
      window.removeEventListener("focus", refresh);
    };
  }, [get, subscribe]);

  return [preferences, setPreferences] as const;
}
