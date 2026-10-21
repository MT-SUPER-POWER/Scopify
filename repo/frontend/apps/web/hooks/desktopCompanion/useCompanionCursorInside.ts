"use client";

import { useEffect, useState } from "react";
import type { RuntimeUnsubscribe } from "@/lib/runtime/types";

/**
 * 订阅主进程按系统光标判定的悬停状态。鼠标穿透时窗口收不到可靠的 DOM 悬停事件，
 * 透明度为 0 的元素也不会触发 leave，所以悬停一律以主进程轮询结果为准。
 */
export function useCompanionCursorInside(
  subscribe: (callback: (inside: boolean) => void) => RuntimeUnsubscribe,
) {
  const [inside, setInside] = useState(false);
  useEffect(() => subscribe(setInside), [subscribe]);
  return inside;
}
