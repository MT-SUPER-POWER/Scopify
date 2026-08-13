"use client";

import { useEffect, useRef } from "react";

import type { PlaybackProjection } from "@scopify/desktop-contract";

import { usePlaybackProjection } from "@/hooks/player/usePlaybackProjection";
import {
  createAudioFeaturePublisherConnection,
  shouldConnectAudioFeaturePublisher,
} from "@/lib/audioFeature/publisherConnection";
import { AudioFeatureHostSampler } from "@/lib/audioFeature/source";
import { runtime } from "@/lib/runtime";

const PUBLISHER_CONNECTION_ID = "playback-host-audio-feature-publisher";
const RECONNECT_DELAY_MS = 1_000;

/**
 * The hidden Playback Host samples its own analyser at 30fps. It neither waits
 * for the Main Window nor consults desktop-wallpaper state, so presentation
 * window lifecycle cannot interrupt the desktop background's feature stream.
 */
export function useDesktopPlaybackWallpaperAudioPublisher() {
  const projection = usePlaybackProjection();
  const projectionRef = useRef<PlaybackProjection>(projection);

  projectionRef.current = projection;

  useEffect(() => {
    if (!shouldConnectAudioFeaturePublisher(runtime.isDesktop, runtime.playbackHost.getNonce()))
      return;

    const sampler = new AudioFeatureHostSampler({
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
