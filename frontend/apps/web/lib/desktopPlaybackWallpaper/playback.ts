import type { DesktopLyricSnapshot } from "@/types/desktopLyric";

export const DESKTOP_WALLPAPER_PRESENTATION_STALE_MS = 1_500;

export function shouldPublishDesktopWallpaperPresentation(
  wallpaperActive: boolean,
  force: boolean,
  elapsedMs: number,
  intervalMs: number,
) {
  return force || (wallpaperActive && elapsedMs >= intervalMs);
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
