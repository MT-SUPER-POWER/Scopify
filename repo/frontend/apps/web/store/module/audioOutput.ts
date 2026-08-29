import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { AudioOutputStore } from "@/types/audioOutput";

export const useAudioOutputStore = create<AudioOutputStore>()(
  persist(
    (set) => ({
      selectedInputDeviceId: "",
      selectedDeviceId: "",
      setSelectedInputDeviceId: (selectedInputDeviceId) => set({ selectedInputDeviceId }),
      setSelectedDeviceId: (selectedDeviceId) => set({ selectedDeviceId }),
    }),
    {
      name: "audio-output-storage",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
