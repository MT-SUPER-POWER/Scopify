"use client";

import { useCallback } from "react";

import { useInWindowShortcuts } from "@/hooks/shortcuts/useInWindowShortcuts";
import type { PlaylistActionsProps } from "@/types/components/playlist";

type PlaylistSearchShortcutOptions = Pick<PlaylistActionsProps, "inputRef" | "onSearchOpen">;

const PLAYLIST_SEARCH_SHORTCUT_COMMAND_IDS = ["focus-playlist-search"] as const;

export function usePlaylistSearchShortcut({
  inputRef,
  onSearchOpen,
}: PlaylistSearchShortcutOptions) {
  const executeCommand = useCallback(() => {
    onSearchOpen();
    window.requestAnimationFrame(() => inputRef.current?.focus());
  }, [inputRef, onSearchOpen]);

  useInWindowShortcuts({
    commandIds: PLAYLIST_SEARCH_SHORTCUT_COMMAND_IDS,
    executeCommand,
    scope: "playlist",
  });
}
