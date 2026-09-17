"use client";

import { useEffect } from "react";
import { runtime } from "@/lib/runtime";
import { useDesktopSubtitleControl } from "@/store/module/desktopSubtitleControl";

export function useDesktopSubtitleControlSync() {
  const open = useDesktopSubtitleControl((state) => state.open);
  const refresh = useDesktopSubtitleControl((state) => state.refresh);
  useEffect(() => {
    if (!runtime.isDesktop) return;
    const sync = () => {
      void refresh();
    };
    sync();
    window.addEventListener("focus", sync);
    const timer = open ? setInterval(sync, 1000) : undefined;
    return () => {
      window.removeEventListener("focus", sync);
      if (timer) clearInterval(timer);
    };
  }, [open, refresh]);
}
