"use client";

import { useSyncExternalStore } from "react";
import type { HistoryNavigationState } from "@/types/ui";

interface NavigationApi extends EventTarget {
  canGoBack: boolean;
  canGoForward: boolean;
}

const UNKNOWN_STATE: HistoryNavigationState = { canGoBack: true, canGoForward: true };
let cachedState = UNKNOWN_STATE;

function getNavigation() {
  return (window as Window & { navigation?: NavigationApi }).navigation;
}

function subscribe(onChange: () => void) {
  const navigation = getNavigation();
  if (!navigation) return () => undefined;
  navigation.addEventListener("currententrychange", onChange);
  return () => navigation.removeEventListener("currententrychange", onChange);
}

function getSnapshot(): HistoryNavigationState {
  const navigation = getNavigation();
  // 不支持 Navigation API 时无法判断，保持按钮可用
  if (!navigation) return UNKNOWN_STATE;
  if (
    cachedState.canGoBack !== navigation.canGoBack ||
    cachedState.canGoForward !== navigation.canGoForward
  ) {
    cachedState = { canGoBack: navigation.canGoBack, canGoForward: navigation.canGoForward };
  }
  return cachedState;
}

/** 当前窗口历史能否后退/前进，用于顶栏导航按钮的禁用态（Electron 的 Chromium 支持 Navigation API）。 */
export function useHistoryNavigationState() {
  return useSyncExternalStore(subscribe, getSnapshot, () => UNKNOWN_STATE);
}
