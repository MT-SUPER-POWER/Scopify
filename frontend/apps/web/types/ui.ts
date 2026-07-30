export interface UiStore {
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
  isLyricsOpen: boolean;
  setIsLyricsOpen: (open: boolean) => void;
  toggleLyrics: () => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
  isQueueOpen: boolean;
  setIsQueueOpen: (open: boolean) => void;
  toggleQueue: () => void;
  isCommandPaletteOpen: boolean;
  setIsCommandPaletteOpen: (open: boolean) => void;
  isShortcutHelpOpen: boolean;
  setIsShortcutHelpOpen: (open: boolean) => void;
  isFullscreen: boolean;
  setIsFullscreen: (fullscreen: boolean) => void;
}
