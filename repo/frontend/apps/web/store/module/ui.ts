import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { UiStore } from "@/types/ui";

export const useUiStore = create<UiStore>()(
  persist(
    (set) => ({
      isSearchOpen: false,
      isCollapsed: false,
      isLyricsOpen: false,
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
      }),
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...(persistedState as Partial<UiStore>),
        isLyricsOpen: false,
      }),
    },
  ),
);
