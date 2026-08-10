import type {
  DesktopLyricSnapshotInput,
  DesktopPlaybackWallpaperAudioFrame,
} from "@scopify/desktop-contract";

const MAXIMUM_AUDIO_SPECTRUM_BINS = 2_048;

export function isDesktopPlaybackWallpaperPresentationInput(
  value: unknown,
): value is DesktopLyricSnapshotInput {
  if (!isRecord(value)) return false;
  return (
    typeof value.isLiked === "boolean" &&
    typeof value.isPlaying === "boolean" &&
    isFiniteNonNegativeNumber(value.positionMs) &&
    (value.track === null || isTrack(value.track)) &&
    "lyrics" in value
  );
}

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

function isTrack(value: unknown) {
  if (!isRecord(value)) return false;
  return (
    (typeof value.id === "number" || typeof value.id === "string") &&
    typeof value.title === "string" &&
    Array.isArray(value.artistNames) &&
    value.artistNames.every((artist) => typeof artist === "string") &&
    isFiniteNonNegativeNumber(value.durationMs) &&
    (value.albumTitle === undefined || typeof value.albumTitle === "string") &&
    (value.artworkUrl === undefined || typeof value.artworkUrl === "string")
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
