import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { LatticePreferences } from "@/types/playlistLattice";

export const useLatticePreferences = create<LatticePreferences>()(
  persist(
    (set) => ({
      followCurrent: false,
      lightsOff: false,
      setFollowCurrent: (followCurrent) => set({ followCurrent }),
      setLightsOff: (lightsOff) => set({ lightsOff }),
    }),
    {
      name: "scopify-lattice-preferences",
      partialize: (state) => ({ followCurrent: state.followCurrent, lightsOff: state.lightsOff }),
    },
  ),
);
