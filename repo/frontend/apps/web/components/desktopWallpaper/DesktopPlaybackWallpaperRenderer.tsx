"use client";

import { useEffect, useState } from "react";

import { FoliaPresentationSurface } from "@/components/lyrics/FoliaPresentationSurface";
import { useFoliaPlaybackBridge } from "@/hooks/player/useFoliaPlaybackBridge";
import { useFoliaPresentationAppearance } from "@/hooks/player/useFoliaPresentationAppearance";
import { usePlaybackProjection } from "@/hooks/player/usePlaybackProjection";
import type { DesktopPlaybackWallpaperRendererProps } from "@/types/components/desktopPlaybackWallpaper";

export function DesktopPlaybackWallpaperRenderer({ model }: DesktopPlaybackWallpaperRendererProps) {
  const [captureBackgroundOnly, setCaptureBackgroundOnly] = useState(false);
  const appearance = useFoliaPresentationAppearance();
  const bridge = useFoliaPlaybackBridge(true);
  const projection = usePlaybackProjection();

  useEffect(() => {
    document.documentElement.classList.add("desktop-playback-wallpaper-html");
    document.body.classList.add("desktop-playback-wallpaper-body");
    return () => {
      document.documentElement.classList.remove("desktop-playback-wallpaper-html");
      document.body.classList.remove("desktop-playback-wallpaper-body");
    };
  }, []);

  useEffect(() => {
    const onCaptureBackground = (event: Event) => {
      const detail = (event as CustomEvent<{ enabled?: unknown }>).detail;
      if (typeof detail?.enabled === "boolean") setCaptureBackgroundOnly(detail.enabled);
    };
    window.addEventListener("desktop-playback-wallpaper:capture-background", onCaptureBackground);
    return () =>
      window.removeEventListener(
        "desktop-playback-wallpaper:capture-background",
        onCaptureBackground,
      );
  }, []);

  const layers = captureBackgroundOnly
    ? { background: true, lyrics: false }
    : model.preferences.layers;

  return (
    <div
      className="absolute inset-0 overflow-hidden"
      data-desktop-playback-wallpaper-capture-background={captureBackgroundOnly ? "true" : "false"}
      data-desktop-playback-wallpaper-content-ready="true"
    >
      {layers.background || layers.lyrics ? (
        <FoliaPresentationSurface
          appearance={appearance}
          bridge={bridge}
          isPlayerChromeHidden
          layers={layers}
          track={
            projection.track ? { ...projection.track, durationMs: projection.durationMs } : null
          }
        />
      ) : null}
    </div>
  );
}
