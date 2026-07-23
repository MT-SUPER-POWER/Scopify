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
      isCommandPaletteOpen: false,
      isShortcutHelpOpen: false,
      isFullscreen: false,
      scrollContainer: null,

      setIsSearchOpen: (open) => set({ isSearchOpen: open }),
      setIsLyricsOpen: (open) => {
        set(() => ({ isLyricsOpen: open }));
      },
      toggleLyrics: () => set((state) => ({ isLyricsOpen: !state.isLyricsOpen })),
      setIsCollapsed: (collapsed) => set({ isCollapsed: collapsed }),
      toggleSidebar: () => set((state) => ({ isCollapsed: !state.isCollapsed })),
      setIsQueueOpen: (open) => set({ isQueueOpen: open }),
      toggleQueue: () => set((state) => ({ isQueueOpen: !state.isQueueOpen })),
      setIsCommandPaletteOpen: (open) => set({ isCommandPaletteOpen: open }),
      setIsShortcutHelpOpen: (open) => set({ isShortcutHelpOpen: open }),
      setIsFullscreen: (fullscreen) => set({ isFullscreen: fullscreen }),
      setScrollContainer: (el) => set({ scrollContainer: el }),
    }),
    {
      name: "ui-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        isLyricsOpen: state.isLyricsOpen,
        isCollapsed: state.isCollapsed,
      }),
    },
  ),
);
