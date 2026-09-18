import type { SubtitlePalette } from "@/types/subtitle-preview";
export function subtitlePalette(settings: SubtitlePalette): SubtitlePalette {
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
