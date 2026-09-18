import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { AudioOutputStore } from "@/types/audioOutput";

export const useAudioOutputStore = create<AudioOutputStore>()(
  persist(
    (set) => ({
      selectedInputDeviceId: "",
      selectedDeviceId: "",
      isPopoverOpen: false,
      setSelectedInputDeviceId: (selectedInputDeviceId) => set({ selectedInputDeviceId }),
      setSelectedDeviceId: (selectedDeviceId) => set({ selectedDeviceId }),
      setPopoverOpen: (isPopoverOpen) => set({ isPopoverOpen }),
      togglePopover: () => set((state) => ({ isPopoverOpen: !state.isPopoverOpen })),
    }),
    {
      name: "audio-output-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        selectedInputDeviceId: state.selectedInputDeviceId,
        selectedDeviceId: state.selectedDeviceId,
      }),
    },
  ),
);
