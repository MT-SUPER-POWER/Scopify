"use client";

import { PlaybackHostSessionRuntime } from "@/components/player/PlaybackHostSessionRuntime";
import { useStoreHydration } from "@/lib/hooks/useStoreHydration";
import { runtime } from "@/lib/runtime";

/**
 * Deliberately headless composition point for the hidden Playback Host renderer.
 *
 * The dedicated preload is the only thing that can turn this route into a media
 * owner. Ordinary Browser and desktop renderers see a null nonce and stay inert.
 */
export function PlaybackHostRoot() {
  const isHydrated = useStoreHydration();
  const nonce = runtime.playbackHost.getNonce();

  if (!isHydrated || !nonce) return null;

  return <PlaybackHostSessionRuntime />;
}
