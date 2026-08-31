import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { normalizeSearchRecentEntries, upsertSearchRecentEntry } from "@/lib/search/searchHistory";
import type { SearchRecentEntry } from "@/types/search";

interface SearchStore {
  query: string;
  isSearching: boolean;
  recent: SearchRecentEntry[];
  removeRecent: (entry: SearchRecentEntry) => void;
  placeholder: string;
  setQuery: (q: string) => void;
  setIsSearching: (b: boolean) => void;
  setPlaceholder: (p: string) => void;
  addRecent: (entry: SearchRecentEntry) => void;
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
      addRecent: (entry) => {
        set({ recent: upsertSearchRecentEntry(get().recent, entry) });
      },
      clearQuery: () => set({ query: "" }),
      clearRecent: () => set({ recent: [] }),
      removeRecent: (entry) => {
        set({
          recent: get().recent.filter((item) => item.keyword !== entry.keyword),
        });
      },
    }),
    {
      name: "search-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        query: state.query,
        recent: state.recent,
        placeholder: state.placeholder,
      }),
      version: 1,
      migrate: (persistedState) => {
        const state = persistedState as Partial<SearchStore>;
        return { ...state, recent: normalizeSearchRecentEntries(state.recent) };
      },
    },
  ),
);

export default useSearchStore;
