import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { MvPlaybackPreferences } from "@/types/mv";

export const useMvPlaybackStore = create<MvPlaybackPreferences>()(
  persist(
    (set) => ({
      autoNext: true,
      playbackRate: 1,
      quality: null,
      setAutoNext: (autoNext) => set({ autoNext }),
      setPlaybackRate: (playbackRate) => set({ playbackRate }),
      setQuality: (quality) => set({ quality }),
    }),
    { name: "mv-playback-preferences", storage: createJSONStorage(() => localStorage) },
  ),
);
