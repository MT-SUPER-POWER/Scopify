"use client";

import { createContext, useContext, type CSSProperties } from "react";

import { kitMotionTokens } from "@scopify/ui/scopify/components/folia-panel/motion";

// Folia settings kit colours (kit/kitTheme.ts) and the player panel's glass (panelTab/shell/
// panelTheme.ts). The panel sets them once as CSS variables and every part reads them from there,
// so no part takes an isDaylight prop. Text and fills follow the song theme's primary colour.

/** The song theme colours the panel is drawn with. */
export interface FoliaPanelColors {
  accentColor?: string;
  primaryColor: string;
}

const ON_ACCENT_DARK = "#17171a";
const ON_ACCENT_LIGHT = "#ffffff";

const channel = (value: number) => {
  const unit = value / 255;
  return unit <= 0.03928 ? unit / 12.92 : ((unit + 0.055) / 1.055) ** 2.4;
};

/** Relative luminance of a #rgb / #rrggbb colour; null for anything else (named, rgba, …). */
const luminance = (color: string): number | null => {
  const hex = color.trim().replace(/^#/, "");
  const full = hex.length === 3 ? [...hex].map((char) => char + char).join("") : hex;
  if (!/^[0-9a-f]{6}$/i.test(full)) return null;
  const [red, green, blue] = [0, 2, 4].map((offset) =>
    channel(Number.parseInt(full.slice(offset, offset + 2), 16)),
  );
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
};

const contrast = (left: number, right: number) =>
  (Math.max(left, right) + 0.05) / (Math.min(left, right) + 0.05);

/** Keep custom theme accents visible on neutral interface surfaces. Theme data stays untouched. */
export const readableAccentColor = (accent: string, surface: string, fallback: string): string => {
  const foreground = luminance(accent);
  const background = luminance(surface);
  return foreground !== null && background !== null && contrast(foreground, background) >= 3
    ? accent
    : fallback;
};

/** The colour of text and marks drawn on the accent: whichever of dark and white reads better. */
export const onAccentColor = (accent: string): string => {
  const accentLuminance = luminance(accent);
  if (accentLuminance === null) return ON_ACCENT_LIGHT;
  const dark = luminance(ON_ACCENT_DARK) ?? 0;
  return contrast(dark, accentLuminance) >= contrast(1, accentLuminance)
    ? ON_ACCENT_DARK
    : ON_ACCENT_LIGHT;
};

/** The kit's colour variables. */
export const settingsTokens = (isDaylight: boolean, colors: FoliaPanelColors): CSSProperties => {
  const accent = colors.accentColor || (isDaylight ? "#18181b" : "#f4f4f5");
  return {
    "--text-primary": colors.primaryColor,
    "--st-menu": isDaylight ? "#ffffff" : "#2b2b30",
    "--st-raise": isDaylight ? "#ffffff" : "#45454c",
    "--st-knob": isDaylight ? "#ffffff" : "#ececee",
    "--st-pv": isDaylight ? "#ececef" : "#151517",
    "--st-t1": "var(--text-primary)",
    "--st-t2": "color-mix(in srgb, var(--text-primary) 62%, transparent)",
    "--st-t3": "color-mix(in srgb, var(--text-primary) 42%, transparent)",
    "--st-line": "color-mix(in srgb, var(--text-primary) 8%, transparent)",
    "--st-line2": "color-mix(in srgb, var(--text-primary) 16%, transparent)",
    "--st-fill": "color-mix(in srgb, var(--text-primary) 7%, transparent)",
    "--st-fill2": "color-mix(in srgb, var(--text-primary) 12%, transparent)",
    "--st-track": "color-mix(in srgb, var(--text-primary) 17%, transparent)",
    "--st-accent": accent,
    "--st-on-accent": onAccentColor(accent),
  } as CSSProperties;
};

/**
 * The panel surface's variables: the kit's colours and motion, plus the glass, its shadow and the
 * colour of a liked heart. In the dark the kit's raised grey is no lighter than a bright page under
 * the glass, so a white veil takes its place.
 */
export const panelTokens = (
  isDaylight: boolean,
  colors: FoliaPanelColors,
  reduced: boolean,
): CSSProperties =>
  ({
    ...settingsTokens(isDaylight, colors),
    ...kitMotionTokens(reduced),
    ...(isDaylight ? null : { "--st-raise": "rgba(255, 255, 255, 0.18)" }),
    "--pn-glass": isDaylight ? "rgba(244, 244, 245, 0.8)" : "rgba(28, 28, 31, 0.8)",
    "--pn-shadow": isDaylight
      ? "0 30px 80px rgba(0, 0, 0, 0.24), 0 0 0 1px rgba(0, 0, 0, 0.06)"
      : "0 30px 80px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(255, 255, 255, 0.09)",
    "--pn-like": isDaylight ? "#e0354f" : "#f2607a",
  }) as CSSProperties;

/** Light or dark, for parts drawn outside the panel (tooltips) where its variables do not reach. */
export const FoliaPanelThemeContext = createContext<{ isDaylight: boolean }>({ isDaylight: false });

export const useFoliaPanelTheme = () => useContext(FoliaPanelThemeContext);
