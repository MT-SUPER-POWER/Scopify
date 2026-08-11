"use client";

import { useEffect } from "react";
import { SHORTCUT_COMMANDS } from "@/constants/shortcuts";
import { getEffectiveShortcutBinding, isShortcutBindingMatch } from "@/lib/shortcuts/bindings";
import { useShortcutStore } from "@/store/module/shortcuts";
import { useUiStore } from "@/store/module/ui";
import type { ShortcutCommandId, ShortcutScope } from "@/types/shortcuts";
import { useShortcutCommands } from "./useShortcutCommands";

interface InWindowShortcutsOptions {
  commandIds?: readonly ShortcutCommandId[];
  executeCommand?: (commandId: ShortcutCommandId) => void;
  scope?: ShortcutScope;
}

const VOLUME_COMMAND_IDS = new Set<ShortcutCommandId>(["increase-volume", "decrease-volume"]);

export function useInWindowShortcuts({
  commandIds,
  executeCommand,
  scope = "global",
}: InWindowShortcutsOptions = {}) {
  const overrides = useShortcutStore((state) => state.overrides);
  const defaultExecuteShortcutCommand = useShortcutCommands();
  const executeShortcutCommand = executeCommand ?? defaultExecuteShortcutCommand;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;

      const ui = useUiStore.getState();
      if (
        event.code === "Escape" &&
        ui.isLyricsOpen &&
        !ui.isSearchOpen &&
        !ui.isCommandPaletteOpen &&
        !ui.isShortcutHelpOpen
      ) {
        event.preventDefault();
        ui.setIsLyricsOpen(false);
        return;
      }

      const command = SHORTCUT_COMMANDS.find((candidate) => {
        if ((candidate.scope ?? "global") !== scope) return false;
        if (commandIds && !commandIds.includes(candidate.id)) return false;
        const binding = getEffectiveShortcutBinding(candidate.id, overrides);
        return binding ? isShortcutBindingMatch(binding, event) : false;
      });

      if (!command) return;
      if (event.repeat && !command.id.startsWith("seek-")) return;
      if (!canHandleShortcutInCurrentFocus(command.id, event.target)) return;

      event.preventDefault();
      executeShortcutCommand(command.id);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [commandIds, executeShortcutCommand, overrides, scope]);
}

function canHandleShortcutInCurrentFocus(commandId: ShortcutCommandId, target: EventTarget | null) {
  if (VOLUME_COMMAND_IDS.has(commandId)) return isShortcutScopeFocused("volume");
  if (
    commandId === "open-search" ||
    commandId === "focus-playlist-search" ||
    commandId === "toggle-mute"
  )
    return true;
  return !isEditableTarget(target);
}

function isShortcutScopeFocused(scope: string) {
  const activeElement = document.activeElement;
  return (
    activeElement instanceof HTMLElement &&
    Boolean(activeElement.closest(`[data-shortcut-scope="${scope}"]`))
  );
}

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  const element = target.closest("input, textarea, select, [contenteditable='true']");
  return element !== null;
}
