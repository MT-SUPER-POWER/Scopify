import { create } from "zustand";
import type { UpdatesStore } from "@/types/updates/model";

export const useUpdatesStore = create<UpdatesStore>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}));
