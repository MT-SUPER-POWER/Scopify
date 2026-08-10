import type { DesktopLyricSnapshot } from "@/types/desktopLyric";
import type { DesktopPlaybackTimeline } from "@/types/desktopPlaybackWallpaper";

export const DESKTOP_WALLPAPER_PRESENTATION_STALE_MS = 1_500;
const DESKTOP_PLAYBACK_DISCONTINUITY_TOLERANCE_MS = 500;

export function shouldPublishDesktopCompanionSnapshot(
  force: boolean,
  elapsedMs: number,
  intervalMs: number,
) {
  return force || elapsedMs >= intervalMs;
}

export function getDesktopWallpaperPlaybackTimeMs(
  presentation: DesktopLyricSnapshot | null,
  now: number,
) {
  if (!presentation) return 0;
  const elapsed = presentation.isPlaying
    ? Math.min(DESKTOP_WALLPAPER_PRESENTATION_STALE_MS, Math.max(0, now - presentation.updatedAt))
    : 0;
  return Math.min(
    presentation.positionMs + elapsed,
    presentation.track?.durationMs ?? Number.POSITIVE_INFINITY,
  );
}

/** Keeps one companion playback clock monotonic between explicit timeline discontinuities. */
export function createDesktopPlaybackTimeline(): DesktopPlaybackTimeline {
  let anchorPositionMs = 0;
  let anchorUpdatedAt = 0;
  let snapshot: DesktopLyricSnapshot | null = null;
  let sourcePositionMs = 0;

  const sample = (now: number) => {
    if (!snapshot) return 0;
    const elapsed = snapshot.isPlaying
      ? Math.min(DESKTOP_WALLPAPER_PRESENTATION_STALE_MS, Math.max(0, now - anchorUpdatedAt))
      : 0;
    return Math.min(
      anchorPositionMs + elapsed,
      snapshot.track?.durationMs ?? Number.POSITIVE_INFINITY,
    );
  };

  return {
    accept(nextSnapshot) {
      if (snapshot && nextSnapshot.updatedAt < snapshot.updatedAt) return false;

      const nextPositionMs = Math.max(
        0,
        Math.min(
          nextSnapshot.positionMs,
          nextSnapshot.track?.durationMs ?? Number.POSITIVE_INFINITY,
        ),
      );
      const sameTrack =
        snapshot?.track?.id !== undefined && snapshot.track.id === nextSnapshot.track?.id;
      const projectedPositionMs = sample(nextSnapshot.updatedAt);
      const jumpedBackward =
        sameTrack &&
        nextPositionMs < sourcePositionMs - DESKTOP_PLAYBACK_DISCONTINUITY_TOLERANCE_MS;
      const jumpedForward =
        sameTrack &&
        nextPositionMs > projectedPositionMs + DESKTOP_PLAYBACK_DISCONTINUITY_TOLERANCE_MS;
      const timelineDiscontinuity = !sameTrack || jumpedBackward || jumpedForward;

      anchorPositionMs = timelineDiscontinuity
        ? nextPositionMs
        : Math.max(nextPositionMs, projectedPositionMs);
      anchorUpdatedAt = nextSnapshot.updatedAt;
      sourcePositionMs = nextPositionMs;
      snapshot = nextSnapshot;
      return true;
    },
    sample,
  };
}

export function downsampleSpectrum(spectrum: number[], maximumBins: number) {
  if (maximumBins <= 0) return [];
  if (spectrum.length <= maximumBins) return [...spectrum];
  const result = new Array<number>(maximumBins);
  const stride = spectrum.length / maximumBins;
  for (let index = 0; index < maximumBins; index += 1) {
    result[index] = spectrum[Math.min(spectrum.length - 1, Math.floor(index * stride))] ?? 0;
  }
  return result;
}
