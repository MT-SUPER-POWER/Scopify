export interface RadioProgramPlaybackProgressInput {
  duration: number;
  isListened?: boolean;
  listenLocation?: number;
}

export type RadioProgramPlaybackProgress =
  { kind: "complete" } | { kind: "none" } | { kind: "partial"; percentage: number };

/** Normalizes a DJ program's cloud listening record into a display state. */
export function getRadioProgramPlaybackProgress({
  duration,
  isListened = false,
  listenLocation,
}: RadioProgramPlaybackProgressInput): RadioProgramPlaybackProgress {
  if (isListened) return { kind: "complete" };
  if (typeof listenLocation !== "number" || !Number.isFinite(listenLocation) || duration <= 0) {
    return { kind: "none" };
  }

  const clampedLocation = Math.min(Math.max(listenLocation, 0), duration);
  const percentage = Math.round((clampedLocation / duration) * 100);

  return percentage >= 100 ? { kind: "complete" } : { kind: "partial", percentage };
}
