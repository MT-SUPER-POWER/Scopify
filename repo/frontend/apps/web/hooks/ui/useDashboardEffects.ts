"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  DESKTOP_PLAYBACK_CONTROLLER_FOLIA_VISUAL_SETTINGS_PATH,
  DESKTOP_PLAYBACK_CONTROLLER_THEME_EDITOR_PATH,
} from "@/constants/desktopPlaybackController";
import { useNowPlayingDocumentTitle } from "@/hooks/player/useNowPlayingDocumentTitle";
import { useTitleBarSymbolColor } from "@/hooks/ui/useTitleBarSymbolColor";
import { runtime } from "@/lib/runtime";
import { useSearchStore } from "@/store/module/search";
import { useUiStore } from "@/store/module/ui";

/** 主界面不渲染任何内容的全局副作用：窗口标题、路由重置，以及来自 Electron 主进程的事件。 */
export function useDashboardEffects() {
  const router = useRouter();
  const pathname = usePathname();
  const clearSearchQuery = useSearchStore((s) => s.clearQuery);
  const setIsCenterLyricsOpen = useUiStore((s) => s.setIsCenterLyricsOpen);
  const setIsFullscreen = useUiStore((s) => s.setIsFullscreen);

  useNowPlayingDocumentTitle();
  useTitleBarSymbolColor();

  // 回到首页清空搜索词；路由切换时关闭中心歌词视图
  useEffect(() => {
    if (pathname === "/") clearSearchQuery();
    setIsCenterLyricsOpen(false);
  }, [pathname, clearSearchQuery, setIsCenterLyricsOpen]);

  // 主进程请求导航（桌面播放控制器自己的设置页由它自己处理，这里不跳转）
  useEffect(() => {
    return runtime.navigation.onNavigate((path) => {
      if (
        path === DESKTOP_PLAYBACK_CONTROLLER_FOLIA_VISUAL_SETTINGS_PATH ||
        path === DESKTOP_PLAYBACK_CONTROLLER_THEME_EDITOR_PATH
      )
        return;
      router.push(path, { scroll: false });
    });
  }, [router]);

  useEffect(() => {
    return runtime.desktopLyrics.onCommand((command) => {
      window.dispatchEvent(new CustomEvent("desktop-lyric:stage-command", { detail: command }));
    });
  }, []);

  useEffect(() => {
    return runtime.window.onFullscreenChanged(setIsFullscreen);
  }, [setIsFullscreen]);
}
