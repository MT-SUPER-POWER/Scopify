"use client";

import { NOW_PLAYING_PANEL_MEDIA_QUERY } from "@/constants/layout";
import { useMediaQuery } from "@/hooks/ui/useMediaQuery";
import { usePlayerStore } from "@/store";
import { useUiStore } from "@/store/module/ui";

/**
 * 右侧正在播放面板的状态：窗口足够宽且有当前歌曲时面板才渲染（canShow），
 * 用户偏好（isOpen）决定展开还是折叠成窄条。窄窗口与无歌曲只是临时让位，不改写偏好。
 */
export function useNowPlayingPanelVisibility() {
  const isOpen = useUiStore((s) => s.isNowPlayingPanelOpen);
  const isWide = useMediaQuery(NOW_PLAYING_PANEL_MEDIA_QUERY);
  const hasSong = usePlayerStore((s) => s.currentSongDetail !== null);

  return {
    /** 当前窗口宽度下面板是否有位置展示 */
    canShow: isWide && hasSong,
    isOpen,
  };
}
