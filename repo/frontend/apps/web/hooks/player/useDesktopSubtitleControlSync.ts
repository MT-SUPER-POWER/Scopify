"use client";

import { useEffect } from "react";
import { runtime } from "@/lib/runtime";
import { useAppearanceStore } from "@/store/module/appearance";
import { useDesktopSubtitleControl } from "@/store/module/desktopSubtitleControl";

export function useDesktopSubtitleControlSync() {
  const refresh = useDesktopSubtitleControl((state) => state.refresh);
  useEffect(() => {
    if (!runtime.isDesktop) return;
    const sync = () => {
      void refresh();
      void useAppearanceStore.persist.rehydrate();
    };
    const unsubscribe = runtime.desktopLyrics.onPreferencesChanged((preferences) => {
      useDesktopSubtitleControl.setState({ preferences, failed: false });
    });
    const storage = (event: StorageEvent) => {
      if (event.key === null || event.key === useAppearanceStore.persist.getOptions().name) {
        void useAppearanceStore.persist.rehydrate();
      }
    };
    sync();
    window.addEventListener("focus", sync);
    window.addEventListener("storage", storage);
    return () => {
      unsubscribe();
      window.removeEventListener("focus", sync);
      window.removeEventListener("storage", storage);
    };
  }, [refresh]);
}
