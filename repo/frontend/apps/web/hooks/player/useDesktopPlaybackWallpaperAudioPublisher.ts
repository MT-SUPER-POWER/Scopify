"use client";

import { useEffect, useRef } from "react";

import type { PlaybackProjection } from "@mt-super-power/desktop-contract";

import { usePlaybackProjection } from "@/hooks/player/usePlaybackProjection";
import {
  createAudioFeaturePublisherConnection,
  shouldConnectAudioFeaturePublisher,
} from "@/lib/audioFeature/publisherConnection";
import { AudioFeatureSourceSampler } from "@/lib/audioFeature/source";
import { runtime } from "@/lib/runtime";

const PUBLISHER_CONNECTION_ID = "main-renderer-audio-feature-publisher";
const RECONNECT_DELAY_MS = 1_000;

/**
 * The desktop Main Authority samples its own analyser at 30fps. Companion
 * window lifecycle cannot interrupt the desktop background's feature stream.
 */
export function useDesktopPlaybackWallpaperAudioPublisher() {
  const projection = usePlaybackProjection();
  const projectionRef = useRef<PlaybackProjection>(projection);

  projectionRef.current = projection;

  useEffect(() => {
    if (!shouldConnectAudioFeaturePublisher(runtime.isDesktop)) return;

    const sampler = new AudioFeatureSourceSampler({
      getProjection: () => projectionRef.current,
      publish: (frame) => runtime.audioFeature.publish(frame),
    });
    const connection = createAudioFeaturePublisherConnection({
      connectionId: PUBLISHER_CONNECTION_ID,
      reconnectDelayMs: RECONNECT_DELAY_MS,
      sampler,
      transport: runtime.audioFeature,
    });

    connection.start();
    return () => connection.dispose();
  }, []);
}
