"use client";

import { useCallback, useEffect, useState } from "react";

import type {
  DesktopPlaybackWallpaperModel,
  DesktopPlaybackWallpaperPreferencesUpdate,
} from "@scopify/desktop-contract";

import { runtime } from "@/lib/runtime";
import type { DesktopPlaybackWallpaperControllerState } from "@/types/desktopPlaybackWallpaper";

export function useDesktopPlaybackWallpaperController(): DesktopPlaybackWallpaperControllerState {
  const [model, setModel] = useState<DesktopPlaybackWallpaperModel | null>(null);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    if (!runtime.isDesktop) return;

    let disposed = false;
    const unsubscribe = runtime.desktopPlaybackWallpaper.onModelChanged((nextModel) => {
      if (!disposed) setModel(nextModel);
    });
    void runtime.desktopPlaybackWallpaper.getModel().then((nextModel) => {
      if (!disposed) setModel(nextModel);
    });

    return () => {
      disposed = true;
      unsubscribe();
    };
  }, []);

  const configure = useCallback(async (update: DesktopPlaybackWallpaperPreferencesUpdate) => {
    if (!runtime.isDesktop) return null;
    setIsPending(true);
    try {
      const nextModel = await runtime.desktopPlaybackWallpaper.configure(update);
      setModel(nextModel);
      return nextModel;
    } finally {
      setIsPending(false);
    }
  }, []);

  const retry = useCallback(async () => {
    if (!runtime.isDesktop) return null;
    setIsPending(true);
    try {
      const nextModel = await runtime.desktopPlaybackWallpaper.retry();
      setModel(nextModel);
      return nextModel;
    } finally {
      setIsPending(false);
    }
  }, []);

  return {
    closeController: () => runtime.desktopPlaybackWallpaper.closeController(),
    configure,
    isPending,
    model,
    retry,
    showController: async () => {
      const result = await runtime.desktopPlaybackWallpaper.showController();
      return result.opened;
    },
  };
}
