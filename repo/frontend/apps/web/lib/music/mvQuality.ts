import type { MvResolution } from "@/types/mv/api";
import type { MvQualityPlaybackSnapshot, MvQualityPlaybackTarget } from "@/types/mv/model";

/** 只列出接口提供的档位，以及播放地址返回的实际分辨率。 */
export function getMvResolutions(resolutions: MvResolution[], current: number) {
  const available = resolutions.map(({ br }) => br);
  return [...new Set([...available, current].filter((br) => Number.isFinite(br) && br > 0))].sort(
    (a, b) => b - a,
  );
}

export function restoreMvQualityPlayback(
  video: MvQualityPlaybackTarget,
  snapshot: MvQualityPlaybackSnapshot,
) {
  video.volume = snapshot.volume;
  video.muted = snapshot.muted;
  video.playbackRate = snapshot.playbackRate;
  video.currentTime = Number.isFinite(video.duration)
    ? Math.min(snapshot.currentTime, video.duration)
    : snapshot.currentTime;
  if (snapshot.paused) video.pause();
}
