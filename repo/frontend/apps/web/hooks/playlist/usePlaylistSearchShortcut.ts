"use client";

import { useCallback } from "react";

import { useShortcutCommands } from "@/hooks/shortcuts/useShortcutCommands";
import { useInWindowShortcuts } from "@/hooks/shortcuts/useInWindowShortcuts";
import type { PlaylistSearchShortcutOptions } from "@/types/components/playlist";

const PLAYLIST_SEARCH_SHORTCUT_COMMAND_IDS = ["focus-playlist-search"] as const;

export function usePlaylistSearchShortcut({
  inputRef,
  onSearchOpen,
  onSearchClose,
  searchOpen,
}: PlaylistSearchShortcutOptions) {
  const focusPlaylistSearch = useCallback(() => {
    if (searchOpen) {
      inputRef.current?.blur();
      onSearchClose();
      return;
    }
    onSearchOpen();
    window.requestAnimationFrame(() => inputRef.current?.focus());
  }, [inputRef, onSearchClose, onSearchOpen, searchOpen]);

  const executeCommand = useShortcutCommands({ focusPlaylistSearch });

  useInWindowShortcuts({
    commandIds: PLAYLIST_SEARCH_SHORTCUT_COMMAND_IDS,
    executeCommand,
    scope: "playlist",
  });
}
