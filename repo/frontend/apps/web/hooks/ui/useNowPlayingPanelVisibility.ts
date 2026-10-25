"use client";

import { NOW_PLAYING_PANEL_MEDIA_QUERY } from "@/constants/layout";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";
import { usePlayerStore } from "@/store";
import { useUiStore } from "@/store/module/ui";

/**
 * 右侧正在播放面板是否实际渲染：用户偏好开启、窗口足够宽、且有当前歌曲。
 * 窄窗口与无歌曲只是临时让位，不改写用户偏好。
 */
export function useNowPlayingPanelVisibility() {
  const isOpen = useUiStore((s) => s.isNowPlayingPanelOpen);
  const isWide = useMediaQuery(NOW_PLAYING_PANEL_MEDIA_QUERY);
  const hasSong = usePlayerStore((s) => s.currentSongDetail !== null);

  return {
    /** 当前窗口宽度下面板是否有位置展示 */
    canShow: isWide && hasSong,
    isOpen,
    visible: isOpen && isWide && hasSong,
  };
}
