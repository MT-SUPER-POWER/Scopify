"use client";

import { useMotionValueEvent, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { type RefObject, useCallback, useEffect, useState } from "react";

import { LANDING_VISUALIZER_MODES } from "@/constants/marketing";
import { useLandingAtmosphere } from "@/hooks/use-landing-atmosphere";
import { useScrollTransform } from "@/hooks/use-scroll-transform";
import { scrollPageTo } from "@/lib/marketing/landing-time";

/** 舞台从微亮到全亮所占的滚动距离（vh）。 */
const LIGHT_UP_VH = 80;
/** 每种歌词动画占的滚动距离（vh）。 */
const MODE_VH = 45;
/** 最后一种动画之后、熄灯离场前的余量（vh）。 */
const TAIL_VH = 40;
const MODE_COUNT = LANDING_VISUALIZER_MODES.length;
const STICKY_VH = LIGHT_UP_VH + MODE_COUNT * MODE_VH + TAIL_VH;
/** 整个章节的高度：吸顶滚动距离再加一屏。 */
export const LYRICS_STAGE_SECTION_VH = STICKY_VH + 100;

/** 「从进入视口到完全离开」这段行程里，各个灯光节点所在的比例。 */
const PASSAGE_VH = LYRICS_STAGE_SECTION_VH + 100;
const passageAt = (vh: number) => vh / PASSAGE_VH;
const SPOTLIGHT_STOPS = [
  passageAt(0),
  passageAt(100),
  passageAt(100 + LIGHT_UP_VH * 0.8),
  passageAt(100 + STICKY_VH - TAIL_VH),
  passageAt(100 + STICKY_VH + 50),
];
/** 进场时只是微微亮，滚进舞台后全亮，最后一种动画结束后熄灯。 */
const SPOTLIGHT_LEVELS = [0, 0.22, 1, 1, 0];

const stickyAt = (vh: number) => vh / STICKY_VH;

/**
 * 歌词舞台的滚动编排：驱动声场里的追光，按 14 种动画的顺序逐一切换，
 * 并提供点选某种动画时滚动到它所在位置的跳转。
 */
export function useLyricsStage(sectionRef: RefObject<HTMLElement | null>) {
  const { setSpotlight } = useLandingAtmosphere();
  const prefersReducedMotion = useReducedMotion() ?? false;
  const [modeIndex, setModeIndex] = useState(0);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end end"] });
  const { scrollYProgress: passage } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const spotlight = useTransform(passage, SPOTLIGHT_STOPS, SPOTLIGHT_LEVELS);
  useMotionValueEvent(spotlight, "change", setSpotlight);
  useEffect(() => {
    setSpotlight(spotlight.get());
    return () => setSpotlight(0);
  }, [setSpotlight, spotlight]);

  useMotionValueEvent(scrollYProgress, "change", (value) => {
    const intoModes = value * STICKY_VH - LIGHT_UP_VH;
    setModeIndex(Math.min(MODE_COUNT - 1, Math.max(0, Math.floor(intoModes / MODE_VH))));
  });

  const headingOpacity = useScrollTransform(
    scrollYProgress,
    [stickyAt(LIGHT_UP_VH * 0.25), stickyAt(LIGHT_UP_VH * 0.7)],
    [1, 0],
  );
  const stageOpacity = useScrollTransform(
    scrollYProgress,
    [stickyAt(LIGHT_UP_VH * 0.5), stickyAt(LIGHT_UP_VH), stickyAt(STICKY_VH - TAIL_VH * 0.6), 1],
    [0, 1, 1, 0],
  );

  const jumpToMode = useCallback(
    (index: number) => {
      const section = sectionRef.current;
      if (!section) return;
      const sectionTop = section.getBoundingClientRect().top + window.scrollY;
      const intoSection = LIGHT_UP_VH + index * MODE_VH + MODE_VH * 0.3;
      scrollPageTo(sectionTop + (intoSection / 100) * window.innerHeight, prefersReducedMotion);
    },
    [prefersReducedMotion, sectionRef],
  );

  return { headingOpacity, jumpToMode, modeIndex, stageOpacity };
}
