import { describe, expect, test } from "bun:test";
import {
  BACKGROUND_PRESETS,
  DEFAULT_BACKGROUND,
  DEFAULT_THEME_SCHEDULE,
  PREVIOUS_DEFAULT_THEME_SCHEDULE,
} from "@/constants/appearance";
import {
  isValidThemeSchedule,
  resolveScheduledTheme,
  upgradeDefaultThemeSchedule,
} from "@/lib/settings/appearance";

describe("theme schedule", () => {
  test("the default covers every built-in theme with valid time boundaries", () => {
    expect(isValidThemeSchedule(DEFAULT_THEME_SCHEDULE)).toBe(true);
    expect(new Set(DEFAULT_THEME_SCHEDULE.map((slot) => slot.themeId))).toEqual(
      new Set(BACKGROUND_PRESETS.map((preset) => preset.id)),
    );
    for (const slot of DEFAULT_THEME_SCHEDULE) {
      const date = new Date(2026, 9, 30, Math.floor(slot.start / 60), slot.start % 60);
      expect(resolveScheduledTheme(DEFAULT_BACKGROUND, [], DEFAULT_THEME_SCHEDULE, date)).toBe(
        slot.themeId,
      );
    }
  });

  test("missing and unchanged legacy schedules receive the complete default", () => {
    expect(upgradeDefaultThemeSchedule(undefined)).toEqual(DEFAULT_THEME_SCHEDULE);
    const saved = PREVIOUS_DEFAULT_THEME_SCHEDULE.map((slot) => ({ ...slot }));
    expect(upgradeDefaultThemeSchedule(saved)).toEqual(DEFAULT_THEME_SCHEDULE);
    expect(saved).toEqual(PREVIOUS_DEFAULT_THEME_SCHEDULE);
  });

  test("custom times and theme choices survive the upgrade", () => {
    const customTime = PREVIOUS_DEFAULT_THEME_SCHEDULE.map((slot, index) => ({
      ...slot,
      start: index === 1 ? 480 : slot.start,
    }));
    const customTheme = PREVIOUS_DEFAULT_THEME_SCHEDULE.map((slot, index) => ({
      ...slot,
      themeId: index === 1 ? ("sage" as const) : slot.themeId,
    }));
    expect(upgradeDefaultThemeSchedule(customTime)).toBe(customTime);
    expect(upgradeDefaultThemeSchedule(customTheme)).toBe(customTheme);
    expect(upgradeDefaultThemeSchedule(DEFAULT_THEME_SCHEDULE)).toBe(DEFAULT_THEME_SCHEDULE);
  });
});
