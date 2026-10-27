"use client";

import { useCallback } from "react";
import { useLatticeView } from "@/store/module/lattice";
import { getCommandDefinition } from "@/constants/shortcuts";
import { useShortcutActionContext } from "@/hooks/shortcuts/useShortcutActionContext";
import type { ShortcutCommandExecutorOptions, ShortcutCommandId } from "@/types/shortcuts";

export function useShortcutCommands(options?: ShortcutCommandExecutorOptions) {
  const actionContext = useShortcutActionContext(options);
  return useCallback(
    (commandId: ShortcutCommandId) => {
      const command = getCommandDefinition(commandId);
      if (!command) return;
      const lattice = useLatticeView.getState();
      if (
        command.isAvailable &&
        !command.isAvailable({
          latticeActive: lattice.active,
          latticeAvailable: lattice.controller !== null,
        })
      )
        return;
      void command.execute(actionContext);
    },
    [actionContext],
  );
}
