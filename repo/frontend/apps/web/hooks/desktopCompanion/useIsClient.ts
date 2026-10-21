"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** 静态导出预渲染与水合阶段返回 false，之后返回 true；依赖 DOM 测量的伴随窗口据此推迟渲染。 */
export function useIsClient() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
