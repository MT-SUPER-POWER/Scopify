"use client";

import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { LANDING_CHAPTERS } from "@/constants/marketing";
import { useLandingActiveChapter } from "@/hooks/use-landing-active-chapter";
import { LandingAtmosphereContext } from "@/lib/marketing/landing-atmosphere-context";
import type {
  LandingAtmosphereTarget,
  LandingAtmosphereValue,
  LandingPalette,
} from "@/types/marketing";

const FIRST_CHAPTER = LANDING_CHAPTERS[0]!;
const THEME_CHAPTER_INDEX = LANDING_CHAPTERS.findIndex((chapter) => chapter.id === "variation");

/** 维护当前章节，并把章节配色（歌词舞台的当前一场、或用户在「你的颜色」里选的主题）交给声场着色器。 */
export function LandingAtmosphereProvider({ children }: { children: ReactNode }) {
  const activeChapter = useLandingActiveChapter(FIRST_CHAPTER.id);
  const [themePalette, setThemePalette] = useState<LandingPalette | null>(null);
  const [stagePalette, setStagePalette] = useState<LandingPalette | null>(null);
  const targetRef = useRef<LandingAtmosphereTarget>({
    intensity: FIRST_CHAPTER.intensity,
    palette: FIRST_CHAPTER.palette,
    spotlight: 0,
  });

  useEffect(() => {
    const chapterIndex = LANDING_CHAPTERS.findIndex((chapter) => chapter.id === activeChapter);
    const chapter = LANDING_CHAPTERS[chapterIndex] ?? FIRST_CHAPTER;
    // 选过主题之后，剩下的页面都换成这套颜色；歌词舞台上每一场有自己的灯光。
    const usesTheme = themePalette !== null && chapterIndex >= THEME_CHAPTER_INDEX;
    const usesStage = stagePalette !== null && chapter.id === "verse";
    targetRef.current.palette = usesStage
      ? stagePalette
      : usesTheme
        ? themePalette
        : chapter.palette;
    targetRef.current.intensity = chapter.intensity;
  }, [activeChapter, stagePalette, themePalette]);

  const setSpotlight = useCallback((spotlight: number) => {
    targetRef.current.spotlight = spotlight;
  }, []);

  const value = useMemo<LandingAtmosphereValue>(
    () => ({ activeChapter, setSpotlight, setStagePalette, setThemePalette, targetRef }),
    [activeChapter, setSpotlight],
  );

  return (
    <LandingAtmosphereContext.Provider value={value}>{children}</LandingAtmosphereContext.Provider>
  );
}
