import type { LyricsPreviewSettings } from "@/types/appearance";
export function subtitlePalette(settings: LyricsPreviewSettings) {
  const {
    color,
    gradientColor,
    colorMode,
    gradientAngle,
    unsungColor,
    secondaryColor,
    backgroundColor,
    backdropOpacity,
  } = settings;
  return {
    color,
    gradientColor,
    colorMode,
    gradientAngle,
    unsungColor,
    secondaryColor,
    backgroundColor,
    backdropOpacity,
  };
}
