import React, { useEffect, useRef } from "react";
import { useShallow } from "zustand/react/shallow";
import type { MotionValue } from "framer-motion";
import {
  ensureVideoLayerFileRestored,
  useVideoLayerSettingsStore,
} from "../../../stores/useVideoLayerSettingsStore";

// src/components/visualizer/videoLayer/VideoLayer.tsx
// Built-in muted video behind the lyrics (above the background, under the lyrics). The video follows
// playback without per-frame React re-renders: play/pause follows the player state, a jump in the
// playback clock (seek, song change) re-aligns it, and slow drift is corrected every few seconds.
// The video position is the song position modulo the video length, so a short loop keeps cycling.

const DRIFT_CHECK_MS = 2000;
const DRIFT_TOLERANCE_SEC = 0.35;
// A clock step bigger than this between two ticks is a seek or a song change, not playback.
const CLOCK_JUMP_SEC = 1;

interface VideoLayerProps {
  /** The shell's pause signal (window hidden etc.); the video stops even while music plays. */
  paused: boolean;
  /** Current playback time in seconds from the visualizer shell. */
  currentTime?: MotionValue<number>;
  /** Optional track identifier to re-align the video on song change. */
  trackKey?: string | number | null;
}

const VideoLayer: React.FC<VideoLayerProps> = ({
  paused,
  currentTime: currentTimeProp,
  trackKey,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  const { enabled, url, opacity, fit, localFileUrl } = useVideoLayerSettingsStore(
    useShallow((state) => ({
      enabled: state.videoLayerEnabled,
      url: state.videoLayerUrl,
      opacity: state.videoLayerOpacity,
      fit: state.videoLayerFit,
      localFileUrl: state.localFileUrl,
    })),
  );

  const source = localFileUrl ?? (url || null);
  const active = enabled && Boolean(source);

  useEffect(() => {
    ensureVideoLayerFileRestored();
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!active || !video) return;

    const getCurrentSeconds = (): number => (currentTimeProp ? currentTimeProp.get() : 0);

    const align = () => {
      if (!Number.isFinite(video.duration) || video.duration <= 0 || video.seeking) return;
      const seconds = getCurrentSeconds();
      const nonNegativeSeconds = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
      const target = nonNegativeSeconds % video.duration;
      if (Math.abs(video.currentTime - target) > DRIFT_TOLERANCE_SEC) {
        video.currentTime = target;
      }
    };

    const followState = () => {
      if (!pausedRef.current) void video.play().catch(() => {});
      else video.pause();
    };

    const onMetadata = () => {
      align();
      followState();
    };

    video.addEventListener("loadedmetadata", onMetadata);
    if (video.readyState >= HTMLMediaElement.HAVE_METADATA) onMetadata();

    let lastClock = getCurrentSeconds();
    let unsubscribeClock: (() => void) | undefined;
    if (currentTimeProp) {
      unsubscribeClock = currentTimeProp.on("change", (value: number) => {
        if (Math.abs(value - lastClock) > CLOCK_JUMP_SEC) align();
        lastClock = value;
      });
    }

    const drift = window.setInterval(align, DRIFT_CHECK_MS);

    return () => {
      window.clearInterval(drift);
      unsubscribeClock?.();
      video.removeEventListener("loadedmetadata", onMetadata);
      video.pause();
    };
  }, [active, currentTimeProp, source]);

  // Re-align when trackKey changes (e.g. song switch)
  useEffect(() => {
    const video = videoRef.current;
    if (!active || !video) return;
    if (!Number.isFinite(video.duration) || video.duration <= 0 || video.seeking) return;
    const seconds = currentTimeProp ? currentTimeProp.get() : 0;
    const nonNegativeSeconds = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
    video.currentTime = nonNegativeSeconds % video.duration;
  }, [active, currentTimeProp, trackKey]);

  // The shell's pause flag changes without touching the source; only play/pause needs to follow.
  useEffect(() => {
    const video = videoRef.current;
    if (!active || !video) return;
    if (paused) {
      video.pause();
    } else {
      void video.play().catch(() => {});
    }
  }, [active, paused]);

  if (!active || !source) return null;

  return (
    <video
      ref={videoRef}
      key={source}
      src={source}
      muted
      loop
      playsInline
      preload="auto"
      aria-hidden
      className="pointer-events-none absolute inset-0 size-full"
      style={{ opacity, objectFit: fit }}
      onError={(error) => {
        console.warn("[VideoLayer] Video failed to load or play:", error);
      }}
    />
  );
};

export default VideoLayer;
