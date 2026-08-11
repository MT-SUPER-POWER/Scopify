import type { DesktopPlaybackWallpaperAudioFrame } from "@scopify/desktop-contract";

const MAXIMUM_AUDIO_SPECTRUM_BINS = 2_048;

export function isDesktopPlaybackWallpaperAudioFrame(
  value: unknown,
): value is DesktopPlaybackWallpaperAudioFrame {
  if (
    !isRecord(value) ||
    !Array.isArray(value.spectrum) ||
    value.spectrum.length > MAXIMUM_AUDIO_SPECTRUM_BINS
  ) {
    return false;
  }
  return (
    isFiniteNonNegativeNumber(value.sampledAt) &&
    [
      value.bass,
      value.lowMid,
      value.mid,
      value.power,
      value.treble,
      value.vocal,
      ...value.spectrum,
    ].every(isAudioMagnitude)
  );
}

function isFiniteNonNegativeNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function isAudioMagnitude(value: unknown): value is number {
  return isFiniteNonNegativeNumber(value) && value <= 255;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
