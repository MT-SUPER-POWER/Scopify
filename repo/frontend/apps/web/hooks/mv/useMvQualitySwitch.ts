"use client";

import { useRef, useState, type RefObject, type SyntheticEvent } from "react";
import type { MvQualityPlaybackSnapshot } from "@/types/mv";
import { restoreMvQualityPlayback } from "@/lib/music/mvQuality";

/** 换源前保存媒体状态，在新源元数据就绪时恢复。 */
export function useMvQualitySwitch(videoRef: RefObject<HTMLVideoElement | null>) {
  const [resolution, setResolution] = useState(1080);
  const [autoPlay, setAutoPlay] = useState(true);
  const pendingRef = useRef<MvQualityPlaybackSnapshot | null>(null);

  const changeResolution = (next: number) => {
    if (next === resolution) return;
    const video = videoRef.current;
    if (video) {
      pendingRef.current = {
        currentTime: video.currentTime,
        paused: video.paused,
        muted: video.muted,
        volume: video.volume,
        playbackRate: video.playbackRate,
      };
      setAutoPlay(!video.paused);
    }
    setResolution(next);
  };

  const restorePlayback = (event: SyntheticEvent<HTMLVideoElement>) => {
    const snapshot = pendingRef.current;
    if (!snapshot) return;
    restoreMvQualityPlayback(event.currentTarget, snapshot);
    pendingRef.current = null;
  };

  return { resolution, autoPlay, changeResolution, restorePlayback };
}
