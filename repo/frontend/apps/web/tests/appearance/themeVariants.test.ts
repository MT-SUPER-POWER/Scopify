import { describe, expect, test } from "bun:test";
import {
  BACKGROUND_PRESETS,
  DEFAULT_BACKGROUND,
  DEFAULT_THEME_SCHEDULE,
} from "@/constants/appearance";
import { normalizeBackgroundTheme } from "@/lib/settings/backgroundThemeVariants";
import { resolveBackgroundPalette, resolveScheduledTheme } from "@/lib/settings/appearance";
import type { LegacyBackgroundTheme, SavedBackgroundTheme } from "@/types/appearance/model";

const legacy: LegacyBackgroundTheme = {
  id: "user:legacy",
  name: "旧主题",
  top: "#A3C9E6",
  bottom: "#485D70",
  intensity: 60,
  height: 320,
};

describe("paired background theme palettes", () => {
  test("each built-in theme keeps one identity with distinct light and dark colors", () => {
    for (const theme of BACKGROUND_PRESETS) {
      const settings = { ...DEFAULT_BACKGROUND, preset: theme.id };
      expect(resolveBackgroundPalette(settings, [], "light")).toEqual({
        id: theme.id,
        ...theme.light,
      });
      expect(resolveBackgroundPalette(settings, [], "dark")).toEqual({
        id: theme.id,
        ...theme.dark,
      });
      expect(theme.light).not.toEqual(theme.dark);
    }
  });

  test("legacy custom themes keep their name, settings and original dark palette", () => {
    const upgraded = normalizeBackgroundTheme(legacy);
    expect(upgraded.id).toBe(legacy.id);
    expect(upgraded.name).toBe(legacy.name);
    expect(upgraded.intensity).toBe(60);
    expect(upgraded.height).toBe(320);
    expect(upgraded.dark).toEqual({ top: legacy.top, bottom: legacy.bottom });
    expect(upgraded.light).not.toEqual(upgraded.dark);
    expect(upgraded).not.toHaveProperty("top");
    expect(legacy.top).toBe("#A3C9E6");
  });

  test("paired palettes survive normalization without sharing mutable color objects", () => {
    const theme = normalizeBackgroundTheme(legacy);
    const next = normalizeBackgroundTheme(theme);
    expect(next).toEqual(theme);
    next.light.top = "#FFFFFF";
    expect(theme.light.top).not.toBe(next.light.top);
    expect(next.dark).toEqual(theme.dark);
  });

  test("saved themes resolve the current mode while schedule identity remains stable", () => {
    const theme = normalizeBackgroundTheme(legacy) as SavedBackgroundTheme;
    const settings = { ...DEFAULT_BACKGROUND, preset: theme.id };
    expect(resolveBackgroundPalette(settings, [theme], "light")).toEqual({
      id: theme.id,
      ...theme.light,
    });
    expect(resolveBackgroundPalette(settings, [theme], "dark")).toEqual({
      id: theme.id,
      ...theme.dark,
    });
    const slots = DEFAULT_THEME_SCHEDULE.map((slot) => ({ ...slot, themeId: theme.id }));
    expect(resolveScheduledTheme(settings, [], slots, new Date(2026, 9, 30, 15))).toBe(theme.id);
  });
});
