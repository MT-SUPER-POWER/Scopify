import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { LatticePreferences, LatticeViewState } from "@/types/playlist/lattice";

export const useLatticePreferences = create<LatticePreferences>()(
  persist(
    (set) => ({
      followCurrent: false,
      lightsOff: false,
      viewMode: "lattice",
      immersive: false,
      setFollowCurrent: (followCurrent) => set({ followCurrent }),
      setLightsOff: (lightsOff) => set({ lightsOff }),
      setViewMode: (viewMode) => set({ viewMode }),
      setImmersive: (immersive) => set({ immersive }),
    }),
    {
      name: "scopify-lattice-preferences",
      partialize: (state) => ({
        followCurrent: state.followCurrent,
        lightsOff: state.lightsOff,
        viewMode: state.viewMode,
        immersive: state.immersive,
      }),
    },
  ),
);

/** Runtime state of the lattice view, shared with the global header and shortcut commands. */
export const useLatticeView = create<LatticeViewState>()((set, get) => ({
  active: false,
  controller: null,
  setActive: (active) => set({ active }),
  register: (controller) => {
    set({ controller });
    return () => {
      if (get().controller === controller) set({ controller: null, active: false });
    };
  },
}));
