"use client";

import { useEffect } from "react";
import { SHORTCUT_COMMANDS } from "@/constants/shortcuts";
import { getEffectiveShortcutBinding, isShortcutBindingMatch } from "@/lib/shortcuts/bindings";
import { useShortcutStore } from "@/store/module/shortcuts";
import { useUiStore } from "@/store/module/ui";
import { useShortcutCommands } from "./useShortcutCommands";

export function useInWindowShortcuts() {
  const overrides = useShortcutStore((state) => state.overrides);
  const executeShortcutCommand = useShortcutCommands();

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
        const binding = getEffectiveShortcutBinding(candidate.id, overrides);
        return binding ? isShortcutBindingMatch(binding, event) : false;
      });

      if (!command) return;
      if (event.repeat && !command.id.startsWith("seek-")) return;
      if (isEditableTarget(event.target) && command.id !== "open-search") return;

      event.preventDefault();
      executeShortcutCommand(command.id);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [executeShortcutCommand, overrides]);
}

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  const element = target.closest("input, textarea, select, [contenteditable='true']");
  return element !== null;
}
