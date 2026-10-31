import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { CommandUsageRecord } from "@/types/commandWorkspace/search";
import type { ShortcutStoreState } from "@/types/shortcuts/model";

export const useShortcutStore = create<ShortcutStoreState>()(
  persist(
    (set) => ({
      commandUsage: {},
      overrides: {},
      usageCounts: {},
      recordCommandUsage: (id) =>
        set((state) => ({
          commandUsage: {
            ...state.commandUsage,
            [id]: { count: (state.commandUsage[id]?.count ?? 0) + 1, lastUsedAt: Date.now() },
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
      version: 1,
      // v0 只记录次数：命令面板页面与快捷命令分两张表，迁移为带最近使用时间的统一记录。
      migrate: (persisted, version) => {
        const state = (persisted ?? {}) as Partial<ShortcutStoreState> & {
          commandWorkspaceUsageCounts?: Record<string, number>;
        };
        if (version >= 1) return state as ShortcutStoreState;
        const { commandWorkspaceUsageCounts = {}, ...rest } = state;
        const now = Date.now();
        const commandUsage: CommandUsageRecord = {};
        for (const [id, count] of Object.entries({
          ...rest.usageCounts,
          ...commandWorkspaceUsageCounts,
        }))
          if (count) commandUsage[id] = { count, lastUsedAt: now };
        return { ...rest, commandUsage } as ShortcutStoreState;
      },
    },
  ),
);
