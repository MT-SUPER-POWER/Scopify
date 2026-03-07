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
      setIsSearchOpen: (open) => set({ isSearchOpen: open }),

      isLyricsOpen: typeof window !== 'undefined' && localStorage.getItem('isLyricsOpen')
        ? JSON.parse(localStorage.getItem('isLyricsOpen') as string)
        : false,
      setIsLyricsOpen: (open) => {
        set({ isLyricsOpen: open });
        if (typeof window !== 'undefined') {
          localStorage.setItem('isLyricsOpen', JSON.stringify(open));
        }
      },
      toggleLyrics: () => {
        const next = !get().isLyricsOpen;
        set({ isLyricsOpen: next });
        if (typeof window !== 'undefined') {
          localStorage.setItem('isLyricsOpen', JSON.stringify(next));
        }
      },

      isCollapsed: false,
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
