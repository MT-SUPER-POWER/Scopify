import { BACKGROUND_PRESETS } from "@/constants/appearance";
import type { BackgroundSettings } from "@/types/appearance";

export function resolveBackgroundPalette(settings: BackgroundSettings, day: number) {
  if (settings.rotation === "daily") {
    return BACKGROUND_PRESETS[day % BACKGROUND_PRESETS.length];
  }
  if (settings.preset === "custom") {
    return { id: "custom" as const, top: settings.customTop, bottom: settings.customBottom };
  }
  return BACKGROUND_PRESETS.find(({ id }) => id === settings.preset) ?? BACKGROUND_PRESETS[0];
}

export function getLocalDay() {
  const now = new Date();
  return Math.floor(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / 86_400_000);
}

export function backgroundGradient(top: string, bottom: string) {
  return `linear-gradient(180deg, ${top} 0%, ${bottom} 38%, transparent 100%)`;
}
