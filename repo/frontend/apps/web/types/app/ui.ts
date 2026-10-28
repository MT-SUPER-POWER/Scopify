/** Whether the window history can move back / forward from the current entry. */
export interface HistoryNavigationState {
  canGoBack: boolean;
  canGoForward: boolean;
}

/** 右侧面板中与队列并列的视图；队列沿用 isQueueOpen，以便快捷键与窄窗口浮层共用同一状态。 */
export type NowPlayingPanelTab = "overview" | "lyrics";

/** 右侧面板封面位正在播放的 MV；记录所属歌曲，切歌后自然失效。 */
export interface NowPlayingMvSelection {
  songId: number;
  mvId: number;
  /** 打开 MV 前歌曲是否在播放，收起 MV 时据此恢复。 */
  resumeSong: boolean;
}

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
  nowPlayingMv: NowPlayingMvSelection | null;
  setNowPlayingMv: (selection: NowPlayingMvSelection | null) => void;
  isQueueOpen: boolean;
  setIsQueueOpen: (open: boolean) => void;
  toggleQueue: () => void;
  isShortcutHelpOpen: boolean;
  setIsShortcutHelpOpen: (open: boolean) => void;
  isFullscreen: boolean;
  setIsFullscreen: (fullscreen: boolean) => void;
}
