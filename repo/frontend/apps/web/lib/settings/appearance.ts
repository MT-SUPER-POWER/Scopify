import { BACKGROUND_PRESETS, DEFAULT_BACKGROUND } from "@/constants/appearance";
import type {
  BackgroundPresetId,
  BackgroundSettings,
  SavedBackgroundTheme,
  ThemeTimeSlot,
} from "@/types/appearance";

export function resolveBackgroundPalette(
  settings: BackgroundSettings,
  themes: SavedBackgroundTheme[] = [],
) {
  const saved = themes.find(({ id }) => id === settings.preset);
  if (saved) return saved;
  if (settings.preset === "custom") {
    return { id: "custom" as const, top: settings.customTop, bottom: settings.customBottom };
  }
  return BACKGROUND_PRESETS.find(({ id }) => id === settings.preset) ?? BACKGROUND_PRESETS[0];
}

export function applyBackgroundTheme(
  background: BackgroundSettings,
  id: BackgroundPresetId,
  themes: SavedBackgroundTheme[],
): BackgroundSettings {
  const theme = themes.find((item) => item.id === id);
  return {
    ...background,
    preset: id,
    rotation: "fixed",
    intensity: theme?.intensity ?? DEFAULT_BACKGROUND.intensity,
    height: theme?.height ?? DEFAULT_BACKGROUND.height,
  };
}

export function resolveScheduledTheme(
  background: BackgroundSettings,
  daily: BackgroundPresetId[],
  slots: ThemeTimeSlot[],
  date: Date,
): BackgroundPresetId {
  if (background.rotation === "daily") {
    const day = Math.floor(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000,
    );
    return daily[day % daily.length] ?? "silver";
  }
  if (background.rotation === "schedule") {
    const minute = date.getHours() * 60 + date.getMinutes();
    return slots.filter((slot) => slot.start <= minute).at(-1)?.themeId ?? "silver";
  }
  return background.preset;
}

export function backgroundGradient(top: string, bottom: string) {
  return `linear-gradient(180deg, ${top} 0%, ${bottom} 38%, transparent 100%)`;
}

export function formatThemeTime(minute: number) {
  return `${Math.floor(minute / 60)
    .toString()
    .padStart(2, "0")}:${(minute % 60).toString().padStart(2, "0")}`;
}

export function isValidThemeSchedule(slots: ThemeTimeSlot[]) {
  return (
    slots.length > 0 &&
    slots[0].start === 0 &&
    slots.every(
      (slot, index) =>
        Number.isInteger(slot.start) &&
        slot.start >= 0 &&
        slot.start < 1440 &&
        (index === 0 || slot.start > slots[index - 1].start),
    )
  );
}
