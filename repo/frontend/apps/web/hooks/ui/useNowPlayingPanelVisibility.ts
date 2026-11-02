"use client";

import { NOW_PLAYING_PANEL_MEDIA_QUERY } from "@/constants/layout";
import { useMediaQuery } from "@/hooks/ui/useMediaQuery";
import { useUiStore } from "@/store/module/ui";

/**
 * 右侧正在播放面板的状态：窗口足够宽时面板即可渲染（canShow），
 * 用户偏好（isOpen）决定展开还是折叠成窄条，无歌曲时由面板显示空状态。
 */
export function useNowPlayingPanelVisibility() {
  const isOpen = useUiStore((s) => s.isNowPlayingPanelOpen);
  const isWide = useMediaQuery(NOW_PLAYING_PANEL_MEDIA_QUERY);

  return {
    /** 当前窗口宽度下面板是否有位置展示 */
    canShow: isWide,
    isOpen,
  };
}
