"use client";

import { useEffect } from "react";
import { UPDATES, UPDATES_SEEN_KEY } from "@/constants/updates";
import { useUpdatesStore } from "@/store/module/updates";
import { useUiStore } from "@/store/module/ui";
import { compareUpdateVersions } from "@/lib/updates/version";

export function useUpdates() {
  const isOpen = useUpdatesStore((state) => state.isOpen);
  const isSearchOpen = useUiStore((state) => state.isSearchOpen);
  const isLyricsOpen = useUiStore((state) => state.isLyricsOpen);

  useEffect(() => {
    // Wait until other app overlays have closed; never interrupt listening or typing.
    if (process.env.NODE_ENV !== "production" || isOpen || isSearchOpen || isLyricsOpen) return;
    const current = UPDATES.releases.find((release) => release.version === UPDATES.currentVersion);
    if (!current?.entries.length) return;
    try {
      const seen = localStorage.getItem(UPDATES_SEEN_KEY);
      if (seen && compareUpdateVersions(seen, UPDATES.currentVersion) >= 0) return;
    } catch {
      // Without persistent storage, keep manual access and avoid a popup every launch.
      return;
    }
    const timeout = window.setTimeout(() => useUpdatesStore.getState().open(), 1200);
    return () => window.clearTimeout(timeout);
  }, [isOpen, isSearchOpen, isLyricsOpen]);

  const close = () => {
    try {
      const seen = localStorage.getItem(UPDATES_SEEN_KEY);
      if (!seen || compareUpdateVersions(seen, UPDATES.currentVersion) < 0) {
        localStorage.setItem(UPDATES_SEEN_KEY, UPDATES.currentVersion);
      }
    } catch {
      // The modal must remain dismissible when browser storage is unavailable.
    }
    useUpdatesStore.getState().close();
  };

  return { isOpen, close };
}
