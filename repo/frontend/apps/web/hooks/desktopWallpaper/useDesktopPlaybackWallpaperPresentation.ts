"use client";

import { useEffect, useState } from "react";

import type { DesktopPlaybackWallpaperModel } from "@scopify/desktop-contract";

import { shouldRenderDesktopPlaybackWallpaper } from "@/lib/desktopPlaybackWallpaper/presentation";
import { runtime } from "@/lib/runtime";

export function useDesktopPlaybackWallpaperPresentation() {
  const [model, setModel] = useState<DesktopPlaybackWallpaperModel | null>(null);

  useEffect(() => {
    let disposed = false;
    let modelEventReceived = false;
    const unsubscribe = runtime.desktopPlaybackWallpaper.onModelChanged((nextModel) => {
      modelEventReceived = true;
      if (!disposed) setModel(nextModel);
    });

    void runtime.desktopPlaybackWallpaper.getModel().then((initialModel) => {
      if (!disposed && !modelEventReceived) setModel(initialModel);
    });

    return () => {
      disposed = true;
      unsubscribe();
    };
  }, []);

  return {
    active: shouldRenderDesktopPlaybackWallpaper(model),
    model,
  };
}
