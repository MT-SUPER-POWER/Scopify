"use client";

import { onlineManager } from "@tanstack/react-query";
import { useSyncExternalStore } from "react";

/** 与 TanStack Query 判断请求是否暂停相同的在线状态：离线时初次加载的请求会处于 paused。 */
export function useIsOnline() {
  return useSyncExternalStore(
    (onChange) => onlineManager.subscribe(onChange),
    () => onlineManager.isOnline(),
    () => true,
  );
}
