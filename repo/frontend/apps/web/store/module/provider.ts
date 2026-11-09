import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { ActiveProviderStore } from "@/types/music/provider";

/** Signed out, the app shows NetEase. */
export const useActiveProviderStore = create<ActiveProviderStore>()(
  persist(
    (set) => ({
      activeProvider: "netease",
      setActiveProvider: (activeProvider) => set({ activeProvider }),
    }),
    {
      name: "scopify-active-provider",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ activeProvider: state.activeProvider }),
    },
  ),
);
