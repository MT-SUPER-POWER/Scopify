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

  // 绑定滚动容器的 ref，供虚拟列表等组件使用
  scrollContainer: HTMLDivElement | null;
  setScrollContainer: (el: HTMLDivElement | null) => void;
}

export const useUiStore = create<UiStore>()(
  persist(
    (set) => ({
      isSearchOpen: false,
      isCollapsed: false,
      isLyricsOpen: false,
      scrollContainer: null,

      setIsSearchOpen: (open) => set({ isSearchOpen: open }),
      setIsLyricsOpen: (open) => {
        set(() => ({ isLyricsOpen: open }));
      },
      toggleLyrics: () => set((state) => ({ isLyricsOpen: !state.isLyricsOpen })),
      setIsCollapsed: (collapsed) => set({ isCollapsed: collapsed }),
      setScrollContainer: (el) => set({ scrollContainer: el }),
    }),
    {
      name: "ui-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        isLyricsOpen: state.isLyricsOpen,
      }),
    },
  ),
);
