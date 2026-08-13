"use client";

import { useDesktopPlaybackWallpaperAudioPublisher } from "@/hooks/player/useDesktopPlaybackWallpaperAudioPublisher";

/** Must remain below PlaybackProjectionProvider so feature frames carry the live authority identity. */
export function PlaybackAudioFeaturePublisher() {
  useDesktopPlaybackWallpaperAudioPublisher();
  return null;
}
