"use client";

import { type RefObject, useCallback, useEffect, useState } from "react";
import type { MvVideoState } from "@/types/mv";

const INITIAL_STATE: MvVideoState = {
  buffered: 0,
  currentTime: 0,
  duration: 0,
  isBuffering: false,
  isPaused: true,
  isMuted: false,
  volume: 1,
};

function readBufferedEnd(video: HTMLVideoElement) {
  const { buffered, currentTime } = video;
  for (let i = 0; i < buffered.length; i += 1) {
    if (buffered.start(i) <= currentTime && currentTime <= buffered.end(i)) return buffered.end(i);
  }
  return buffered.length ? buffered.end(buffered.length - 1) : 0;
}

/** 订阅 video 元素的播放进度、缓冲、音量等状态，供自定义播放控件渲染。 */
export function useMvVideoState(videoRef: RefObject<HTMLVideoElement | null>, src: string | null) {
  const [state, setState] = useState<MvVideoState>(INITIAL_STATE);

  const seekTo = useCallback(
    (time: number) => {
      const video = videoRef.current;
      if (!video || !Number.isFinite(time)) return;
      const target = Math.max(0, time);
      video.currentTime = Number.isFinite(video.duration)
        ? Math.min(target, video.duration)
        : target;
      // 松手清除拖动预览的同一批更新内接上目标进度，不等待异步媒体事件。
      setState((current) => ({ ...current, currentTime: video.currentTime }));
    },
    [videoRef],
  );

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const sync = () =>
      setState({
        buffered: readBufferedEnd(video),
        currentTime: video.currentTime,
        duration: Number.isFinite(video.duration) ? video.duration : 0,
        isBuffering: video.readyState < HTMLMediaElement.HAVE_FUTURE_DATA && !video.paused,
        isPaused: video.paused,
        isMuted: video.muted,
        volume: video.volume,
      });
    const events = [
      "timeupdate",
      "durationchange",
      "progress",
      "play",
      "pause",
      "waiting",
      "playing",
      "volumechange",
      "seeked",
      "loadedmetadata",
    ] as const;
    sync();
    for (const event of events) video.addEventListener(event, sync);
    return () => {
      for (const event of events) video.removeEventListener(event, sync);
    };
  }, [src, videoRef]);

  return { ...state, seekTo };
}
