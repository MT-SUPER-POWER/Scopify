"use client";

import { useEffect, useState } from "react";
import { DEFAULT_BACKGROUND } from "@/constants/appearance";
import { getLocalDay, resolveBackgroundPalette } from "@/lib/settings/appearance";
import { useAppearanceStore } from "@/store/module/appearance";

export function useAppearanceBackground() {
  const saved = useAppearanceStore((state) => state.background);
  const [mounted, setMounted] = useState(false);
  const [day, setDay] = useState(0);
  const settings = mounted ? saved : DEFAULT_BACKGROUND;

  useEffect(() => {
    setMounted(true);
    setDay(getLocalDay());
  }, []);

  useEffect(() => {
    if (saved.rotation !== "daily") return;
    const updateDay = () => setDay(getLocalDay());
    updateDay();
    const timer = window.setInterval(updateDay, 60_000);
    window.addEventListener("focus", updateDay);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", updateDay);
    };
  }, [saved.rotation]);

  return { settings, palette: resolveBackgroundPalette(settings, day) };
}
