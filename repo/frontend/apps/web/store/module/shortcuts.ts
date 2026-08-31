import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { ShortcutStoreState } from "@/types/shortcuts";

export const useShortcutStore = create<ShortcutStoreState>()(
  persist(
    (set) => ({
      commandWorkspaceUsageCounts: {},
      overrides: {},
      usageCounts: {},
      incrementCommandWorkspaceUsage: (page) =>
        set((state) => ({
          commandWorkspaceUsageCounts: {
            ...state.commandWorkspaceUsageCounts,
            [page]: (state.commandWorkspaceUsageCounts[page] ?? 0) + 1,
          },
        })),
      setOverride: (commandId, binding) =>
        set((state) => ({
          overrides: { ...state.overrides, [commandId]: binding },
        })),
      resetOverride: (commandId) =>
        set((state) => {
          const { [commandId]: _removed, ...overrides } = state.overrides;
          return { overrides };
        }),
      resetAllOverrides: () => set({ overrides: {} }),
      incrementUsage: (commandId) =>
        set((state) => ({
          usageCounts: {
            ...state.usageCounts,
            [commandId]: (state.usageCounts[commandId] ?? 0) + 1,
          },
        })),
    }),
    {
      name: "shortcut-storage",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
