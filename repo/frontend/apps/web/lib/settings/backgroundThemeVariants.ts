import type {
  BackgroundPresetId,
  BackgroundTheme,
  LegacyBackgroundTheme,
} from "@/types/appearance/model";

/** Preserve the old palette as dark and derive a gentle light fallback once during migration. */
export function normalizeBackgroundTheme<TId extends BackgroundPresetId>(
  theme: (BackgroundTheme | LegacyBackgroundTheme) & { id: TId },
): BackgroundTheme & { id: TId } {
  if ("light" in theme) {
    return { ...theme, light: { ...theme.light }, dark: { ...theme.dark } };
  }
  const { top, bottom, ...identity } = theme;
  return {
    ...identity,
    dark: { top, bottom },
    light: { top: softenBackgroundColor(top), bottom: softenBackgroundColor(bottom) },
  };
}

function softenBackgroundColor(color: string) {
  const hex = color.replace(/^#([\da-f])([\da-f])([\da-f])$/i, "#$1$1$2$2$3$3");
  if (!/^#[\da-f]{6}$/i.test(hex)) return color;
  const warmWhite = [250, 248, 245];
  return `#${warmWhite
    .map((channel, index) => {
      const original = Number.parseInt(hex.slice(index * 2 + 1, index * 2 + 3), 16);
      return Math.round(original * 0.2 + channel * 0.8)
        .toString(16)
        .padStart(2, "0");
    })
    .join("")}`;
}
