"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import type { DesktopPlaybackWallpaperModel } from "@scopify/desktop-contract";
import { PlaybackMediaRuntimeProvider } from "@/components/player/PlaybackMediaRuntimeProvider";

// The wallpaper renderer brings the entire Folia visualizer graph into the
// bundle. It is only used by the dedicated desktop-wallpaper window, so keep
// it out of every dashboard route until that window actually activates it.
const loadRenderer = () =>
  import("@/components/desktopWallpaper/DesktopPlaybackWallpaperRenderer").then((module) => ({
    default: module.DesktopPlaybackWallpaperRenderer,
  }));

// The desktop host waits for the ready marker; this tells it the surface is still loading (a first
// run or an update has none of these chunks yet) so it keeps waiting instead of giving up.
const Renderer = dynamic(loadRenderer, {
  loading: () => (
    <div data-desktop-playback-wallpaper-loading="true" className="absolute inset-0" />
  ),
  ssr: false,
});

/** 桌面壁纸窗口：整个主界面被替换成只有壁纸渲染器的一层。 */
export function WallpaperSurface({ model }: { model: DesktopPlaybackWallpaperModel }) {
  return (
    <PlaybackMediaRuntimeProvider>
      <main
        data-desktop-playback-wallpaper-root
        className="relative h-screen w-screen overflow-hidden bg-transparent"
      >
        <Renderer model={model} />
      </main>
    </PlaybackMediaRuntimeProvider>
  );
}

/** 偏好显示壁纸时提前拉取渲染器，赶在宿主把这个窗口切成只有 Stage 的形态之前。 */
export function useWallpaperPreload(enabled: boolean) {
  useEffect(() => {
    if (enabled) void loadRenderer();
  }, [enabled]);
}
