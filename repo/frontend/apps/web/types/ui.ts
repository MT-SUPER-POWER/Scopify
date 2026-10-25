/** Now Playing panel shape predicted for loading placeholders before hydration. */
export type NowPlayingLoadingState = "panel" | "rail" | null;

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
  isQueueOpen: boolean;
  setIsQueueOpen: (open: boolean) => void;
  toggleQueue: () => void;
  isShortcutHelpOpen: boolean;
  setIsShortcutHelpOpen: (open: boolean) => void;
  isFullscreen: boolean;
  setIsFullscreen: (fullscreen: boolean) => void;
}
