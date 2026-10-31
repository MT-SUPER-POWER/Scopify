"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { useSmartRouter } from "@/hooks/core/useSmartRouter";
import { useDesktopPlaybackWallpaperController } from "@/hooks/desktopWallpaper/useDesktopPlaybackWallpaperController";
import { usePlaybackCommands } from "@/hooks/player/usePlaybackCommands";
import { usePlaybackProjection } from "@/hooks/player/usePlaybackProjection";
import { runtime } from "@/lib/runtime";
import { useTranslation } from "react-i18next";

import type { LyricData } from "@/types/lyrics/model";

export function useTrayPanel() {
  const smartRouter = useSmartRouter();
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const isDesktop = runtime.isDesktop;
  const wallpaper = useDesktopPlaybackWallpaperController();
  const playback = usePlaybackProjection<LyricData>();
  const playbackCommands = usePlaybackCommands();

  const playNext = () => void playbackCommands.next();
  const playPrev = () => void playbackCommands.previous();
  const togglePlay = () => void playbackCommands.toggle();
  const handleVolumeChange = (newVolume: number) => {
    void playbackCommands.setVolume(newVolume);
  };
  const toggleLike = () => void playbackCommands.toggleLike();
  const [controllerOpen, setControllerOpen] = useState(false);

  useEffect(() => {
    if (isDesktop) {
      void runtime.desktopPlaybackWallpaper.isControllerOpen().then((open) => {
        setControllerOpen(open);
      });
    }
  }, [isDesktop]);

  const toggleDesktopPlaybackController = async () => {
    try {
      const next = await runtime.desktopPlaybackWallpaper.toggleController();
      setControllerOpen(next);
    } catch {
      toast.error(t("desktopPlaybackController.openFailed"));
    }
  };

  const setDesktopPlaybackWallpaperEnabled = async (enabled: boolean) => {
    try {
      await wallpaper.configure({ enabled });
    } catch {
      toast.error(t("desktopPlaybackController.updateFailed"));
    }
  };

  // 路由跳转副作用，必须放在所有 Hook 之前
  useEffect(() => {
    if (!isDesktop && typeof window !== "undefined") {
      smartRouter.replace("/");
    }
  }, [isDesktop, smartRouter]);

  // 水合问题
  useEffect(() => {
    Promise.resolve().then(() => {
      setMounted(true);
    });
  }, []);

  return {
    mounted,
    isDesktop,
    wallpaper,
    playback,
    controllerOpen,
    playNext,
    playPrev,
    togglePlay,
    toggleLike,
    handleVolumeChange,
    toggleDesktopPlaybackController,
    setDesktopPlaybackWallpaperEnabled,
  };
}
