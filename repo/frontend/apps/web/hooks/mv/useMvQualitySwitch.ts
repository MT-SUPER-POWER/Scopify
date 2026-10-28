"use client";

import { useRef, useState, type RefObject, type SyntheticEvent } from "react";
import type { MvQualityPlaybackSnapshot } from "@/types/mv/model";
import { restoreMvQualityPlayback } from "@/lib/music/mvQuality";
import { useMvPlaybackStore } from "@/store/module/mvPlayback";
import type { MvResolution } from "@/types/mv/api";

/** 换源前保存媒体状态，在新源元数据就绪时恢复。 */
export function useMvQualitySwitch(
  videoRef: RefObject<HTMLVideoElement | null>,
  resolutions: MvResolution[],
) {
  const quality = useMvPlaybackStore((state) => state.quality);
  const setQuality = useMvPlaybackStore((state) => state.setQuality);
  const available = resolutions
    .map(({ br }) => br)
    .filter((br) => Number.isFinite(br) && br > 0)
    .sort((a, b) => b - a);
  const resolution =
    quality === null
      ? (available[0] ?? 1080)
      : (available.find((br) => br <= quality) ?? available[0] ?? quality);
  const [autoPlay, setAutoPlay] = useState(true);
  const pendingRef = useRef<MvQualityPlaybackSnapshot | null>(null);

  const changeResolution = (next: number | null) => {
    if (next === quality) return;
    const nextResolution =
      next === null
        ? (available[0] ?? 1080)
        : (available.find((br) => br <= next) ?? available[0] ?? next);
    if (nextResolution === resolution) {
      setQuality(next);
      return;
    }
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
    setQuality(next);
  };

  const restorePlayback = (event: SyntheticEvent<HTMLVideoElement>) => {
    const snapshot = pendingRef.current;
    if (!snapshot) return;
    restoreMvQualityPlayback(event.currentTarget, snapshot);
    pendingRef.current = null;
  };

  return { resolution, autoPlay, changeResolution, restorePlayback };
}
