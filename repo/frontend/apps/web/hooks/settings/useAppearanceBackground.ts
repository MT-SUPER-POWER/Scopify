"use client";

import { useEffect, useState } from "react";
import { DEFAULT_BACKGROUND } from "@/constants/appearance";
import {
  applyBackgroundTheme,
  resolveBackgroundPalette,
  resolveScheduledTheme,
} from "@/lib/settings/appearance";
import { useAppearanceStore } from "@/store/module/appearance";

export function useAppearanceBackground() {
  const saved = useAppearanceStore((state) => state.background);
  const themes = useAppearanceStore((state) => state.themes);
  const daily = useAppearanceStore((state) => state.dailyThemeIds);
  const schedule = useAppearanceStore((state) => state.schedule);
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    const update = () => {
      const date = new Date();
      setNow((previous) =>
        previous && Math.floor(previous.getTime() / 60_000) === Math.floor(date.getTime() / 60_000)
          ? previous
          : date,
      );
    };
    update();
    if (saved.rotation === "fixed") return;
    const timer = window.setInterval(update, 1000);
    window.addEventListener("focus", update);
    document.addEventListener("visibilitychange", update);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", update);
      document.removeEventListener("visibilitychange", update);
    };
  }, [saved.rotation]);
  const base = now ? saved : DEFAULT_BACKGROUND;
  const id = now ? resolveScheduledTheme(base, daily, schedule, now) : base.preset;
  const settings =
    base.rotation === "fixed"
      ? base
      : { ...applyBackgroundTheme(base, id, themes), rotation: base.rotation };
  return { settings, palette: resolveBackgroundPalette(settings, themes) };
}
