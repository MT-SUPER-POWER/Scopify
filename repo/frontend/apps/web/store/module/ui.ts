import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { UiStore } from "@/types/ui";

export const useUiStore = create<UiStore>()(
  persist(
    (set) => ({
      isSearchOpen: false,
      isCollapsed: false,
      isLyricsOpen: false,
      isNowPlayingPanelOpen: true,
      nowPlayingPanelTab: "overview",
      isQueueOpen: false,
      isShortcutHelpOpen: false,
      isFullscreen: false,

      setIsSearchOpen: (open) => set({ isSearchOpen: open }),
      setIsLyricsOpen: (open) => {
        set(() => ({ isLyricsOpen: open }));
      },
      toggleLyrics: () => set((state) => ({ isLyricsOpen: !state.isLyricsOpen })),
      setIsCollapsed: (collapsed) => set({ isCollapsed: collapsed }),
      toggleSidebar: () => set((state) => ({ isCollapsed: !state.isCollapsed })),
      // 收起面板时一并退出队列视图，否则折叠条会因队列仍为打开状态而立刻重新展开
      setIsNowPlayingPanelOpen: (open) =>
        set(
          open
            ? { isNowPlayingPanelOpen: true }
            : { isNowPlayingPanelOpen: false, isQueueOpen: false },
        ),
      toggleNowPlayingPanel: () =>
        set((state) =>
          state.isNowPlayingPanelOpen
            ? { isNowPlayingPanelOpen: false, isQueueOpen: false }
            : { isNowPlayingPanelOpen: true },
        ),
      setNowPlayingPanelTab: (tab) => set({ nowPlayingPanelTab: tab, isQueueOpen: false }),
      setIsQueueOpen: (open) => set({ isQueueOpen: open }),
      toggleQueue: () => set((state) => ({ isQueueOpen: !state.isQueueOpen })),
      setIsShortcutHelpOpen: (open) => set({ isShortcutHelpOpen: open }),
      setIsFullscreen: (fullscreen) => set({ isFullscreen: fullscreen }),
    }),
    {
      name: "ui-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        isCollapsed: state.isCollapsed,
        isNowPlayingPanelOpen: state.isNowPlayingPanelOpen,
        nowPlayingPanelTab: state.nowPlayingPanelTab,
      }),
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...(persistedState as Partial<UiStore>),
        isLyricsOpen: false,
      }),
    },
  ),
);
