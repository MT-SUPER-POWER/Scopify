"use client";

import { useCallback, useMemo } from "react";
import { SHORTCUT_COMMANDS } from "@/constants/shortcuts";
import { findShortcutConflict, getEffectiveShortcutBinding } from "@/lib/shortcuts/bindings";
import { useShortcutStore } from "@/store/module/shortcuts";
import type {
  ShortcutAssignmentResult,
  ShortcutBinding,
  ShortcutCommandId,
} from "@/types/shortcuts";

export function useShortcutRegistry() {
  const overrides = useShortcutStore((state) => state.overrides);
  const setOverride = useShortcutStore((state) => state.setOverride);
  const resetOverride = useShortcutStore((state) => state.resetOverride);
  const resetAllOverrides = useShortcutStore((state) => state.resetAllOverrides);

  const commands = useMemo(
    () =>
      SHORTCUT_COMMANDS.map((command) => ({
        ...command,
        binding: getEffectiveShortcutBinding(command.id, overrides),
        isCustomized: command.id in overrides,
      })),
    [overrides],
  );

  const assignShortcut = useCallback(
    (commandId: ShortcutCommandId, binding: ShortcutBinding): ShortcutAssignmentResult => {
      const conflictCommandId = findShortcutConflict(commandId, binding, overrides);
      if (conflictCommandId) return { ok: false, conflictCommandId };

      setOverride(commandId, binding);
      return { ok: true };
    },
    [overrides, setOverride],
  );

  return {
    commands,
    assignShortcut,
    disableShortcut: (commandId: ShortcutCommandId) => setOverride(commandId, null),
    resetShortcut: resetOverride,
    resetAllShortcuts: resetAllOverrides,
  };
}
