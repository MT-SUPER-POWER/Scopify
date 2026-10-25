/** Whether the window history can move back / forward from the current entry. */
export interface HistoryNavigationState {
  canGoBack: boolean;
  canGoForward: boolean;
}

/** 右侧面板中与队列并列的视图；队列沿用 isQueueOpen，以便快捷键与窄窗口浮层共用同一状态。 */
export type NowPlayingPanelTab = "overview" | "lyrics";

export interface UiStore {
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
  isLyricsOpen: boolean;
  setIsLyricsOpen: (open: boolean) => void;
  toggleLyrics: () => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
  /** 用户是否希望显示右侧正在播放面板；窄窗口或无歌曲时仍会自动隐藏。 */
  isNowPlayingPanelOpen: boolean;
  setIsNowPlayingPanelOpen: (open: boolean) => void;
  toggleNowPlayingPanel: () => void;
  nowPlayingPanelTab: NowPlayingPanelTab;
  /** 切换面板视图，同时退出队列视图。 */
  setNowPlayingPanelTab: (tab: NowPlayingPanelTab) => void;
  isQueueOpen: boolean;
  setIsQueueOpen: (open: boolean) => void;
  toggleQueue: () => void;
  isShortcutHelpOpen: boolean;
  setIsShortcutHelpOpen: (open: boolean) => void;
  isFullscreen: boolean;
  setIsFullscreen: (fullscreen: boolean) => void;
}
