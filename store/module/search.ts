import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface SearchStore {
  query: string;
  isSearching: boolean;
  recent: string[];
  removeRecent: (q: string) => void;
  placeholder: string;
  setQuery: (q: string) => void;
  setIsSearching: (b: boolean) => void;
  setPlaceholder: (p: string) => void;
  addRecent: (q: string) => void;
  clearQuery: () => void;
  clearRecent: () => void;
}

export const useSearchStore = create<SearchStore>()(
  persist(
    (set, get) => ({
      query: "",
      isSearching: false,
      recent: [],
      placeholder: "What do you want to listen to?",
      setQuery: (q: string) => set({ query: q }),
      setIsSearching: (b) => set({ isSearching: b }),
      setPlaceholder: (p: string) => set({ placeholder: p }),
      addRecent: (q: string) => {
        const list = get().recent.slice();
        if (!q) return;
        // keep uniqueness and cap to 20
        const idx = list.indexOf(q);
        if (idx !== -1) list.splice(idx, 1);
        list.unshift(q);
        if (list.length > 20) list.length = 20;
        set({ recent: list });
      },
      clearQuery: () => set({ query: "" }),
      clearRecent: () => set({ recent: [] }),
      removeRecent: (q: string) => {
        const list = get().recent.slice();
        const idx = list.indexOf(q);
        if (idx !== -1) {
          list.splice(idx, 1);
          set({ recent: list });
        }
      },
    }),
    {
      name: "search-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ query: state.query, recent: state.recent, placeholder: state.placeholder }),
    }
  )
);

export default useSearchStore;
