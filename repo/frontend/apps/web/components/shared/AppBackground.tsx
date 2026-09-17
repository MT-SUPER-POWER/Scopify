"use client";

import { useAppearanceBackground } from "@/hooks/settings/useAppearanceBackground";
import { backgroundGradient } from "@/lib/settings/appearance";
import { cn } from "@/lib/utils";
import type { AppBackgroundProps } from "@/types/appearance";

export function AppBackground({ className }: AppBackgroundProps) {
  const { settings, palette } = useAppearanceBackground();
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute inset-x-0 top-0 z-0", className)}
      style={{
        height: settings.height,
        opacity: settings.intensity / 100,
        backgroundImage: backgroundGradient(palette.top, palette.bottom),
      }}
    />
  );
}
