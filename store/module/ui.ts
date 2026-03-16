import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface UiStore {
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;

  isLyricsOpen: boolean;
  setIsLyricsOpen: (open: boolean) => void;
  toggleLyrics: () => void;

  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

export const useUiStore = create<UiStore>()(
  persist(
    (set, get) => ({
      isSearchOpen: false,
      isCollapsed: false,
      isLyricsOpen: false,

      setIsSearchOpen: (open) => set({ isSearchOpen: open }),
      setIsLyricsOpen: (open) => { set(() => ({ isLyricsOpen: open })); },
      toggleLyrics: () => set((state) => ({ isLyricsOpen: !state.isLyricsOpen })),
      setIsCollapsed: (collapsed) => set({ isCollapsed: collapsed }),
    }),
    {
      name: 'ui-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        isLyricsOpen: state.isLyricsOpen,
      }),
    }
  )
);

