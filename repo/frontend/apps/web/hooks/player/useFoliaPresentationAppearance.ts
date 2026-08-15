"use client";

import { useMemo } from "react";

import type { Theme } from "@/components/lyrics/folia/src/types";
import { useFoliaStageAssets } from "@/hooks/player/useFoliaStageAssets";
import { getFoliaStageTheme, getFoliaThemeColors } from "@scopify/ui/folia";
import { useLyricStageStore } from "@/store/module/lyrics";
import type { FoliaPresentationAppearance } from "@/types/foliaStage";

export function useFoliaPresentationAppearance(): FoliaPresentationAppearance {
  const assets = useFoliaStageAssets();
  const settings = useLyricStageStore();
  const activeStageTheme = getFoliaStageTheme(settings.themes, settings.themeId);
  const activeThemeColors = getFoliaThemeColors(activeStageTheme, settings.themeVariant);
  const isDaylight = settings.themeVariant === "light";
  const theme = useMemo<Theme>(
    () => ({
      ...activeThemeColors,
      animationIntensity: settings.animationIntensity,
      fontStyle: settings.fontStyle,
      fontFamily: settings.fontFamily ?? undefined,
      fontFamilyStack: [],
      name: isDaylight ? "snow" : settings.themeId,
    }),
    [
      activeThemeColors,
      isDaylight,
      settings.animationIntensity,
      settings.fontFamily,
      settings.fontStyle,
      settings.themeId,
    ],
  );
  const subtitleTheme = useMemo<Theme>(
    () =>
      settings.subtitleFontInheritsLyrics
        ? theme
        : {
            ...theme,
            fontFamily: settings.subtitleFontFamily ?? undefined,
            fontFamilyStack: settings.subtitleFontFallbackFamilies,
            fontStyle: settings.subtitleFontStyle,
          },
    [settings, theme],
  );

  return { assets, isDaylight, settings, subtitleTheme, theme };
}
