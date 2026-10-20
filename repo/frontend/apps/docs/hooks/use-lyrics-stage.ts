"use client";

import {
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import { type RefObject, useCallback, useEffect, useState } from "react";

import { LANDING_VISUALIZER_MODES } from "@/constants/marketing";
import { useLandingAtmosphere } from "@/hooks/use-landing-atmosphere";
import { useScrollTransform } from "@/hooks/use-scroll-transform";
import { HERO_STAGE_OVERLAP_VH } from "@/lib/marketing/landing-hero-timeline";
import {
  approachScale,
  clamp01,
  easeInOut,
  focusRingDetent,
} from "@/lib/marketing/landing-stage-camera";
import { scrollPageTo } from "@/lib/marketing/landing-time";

/** 镜头从远处推到舞台跟前所占的滚动距离（vh）。 */
const APPROACH_VH = 130;
/** 推近开始时舞台的大小：远处一小片被照亮的歌词。 */
const DISTANT_SCALE = 0.4;
/** 镜头对准的位置（舞台高度的百分比）：歌词大致落在这一行。 */
export const STAGE_FOCUS_Y = 60;
/** 舞台那片光的软边半径（舞台宽度的百分比）：从中间一小片铺到盖满整屏。 */
const STAGE_MASK_FROM = 42;
const STAGE_MASK_TO = 160;
/** 远处舞台的失焦半径（px），以及推近到哪里（占推近距离的比例）完全对上焦。 */
const DISTANT_BLUR = 8;
const FOCUS_AT = 0.6;
/** 每种歌词动画占的滚动距离（vh）。 */
const MODE_VH = 45;
/** 最后一种动画之后、熄灯离场前的余量（vh）。 */
const TAIL_VH = 40;
const MODE_COUNT = LANDING_VISUALIZER_MODES.length;
const STICKY_VH = APPROACH_VH + MODE_COUNT * MODE_VH + TAIL_VH;
/** 整个章节的高度：吸顶滚动距离再加一屏。 */
export const LYRICS_STAGE_SECTION_VH = STICKY_VH + 100;
/**
 * 章节向上叠进前奏的距离（vh）：吸顶前从屏幕底部升上来的那一屏保持不可见，
 * 再多叠一段，让舞台在镜头穿过前奏窗口时就已经吸顶亮起。
 */
export const LYRICS_STAGE_OVERLAP_VH = 100 + HERO_STAGE_OVERLAP_VH;
/** 迷你播放器跳到「主歌」时落在这里（vh）：远处的舞台与标题都已亮起。 */
export const LYRICS_STAGE_ANCHOR_VH = Math.round(APPROACH_VH * 0.32);

/** 「从进入视口到完全离开」这段行程里，各个灯光节点所在的比例。 */
const PASSAGE_VH = LYRICS_STAGE_SECTION_VH + 100;
const passageAt = (vh: number) => vh / PASSAGE_VH;
const SPOTLIGHT_STOPS = [
  passageAt(60),
  passageAt(100 + APPROACH_VH * 0.25),
  passageAt(100 + APPROACH_VH * 0.9),
  passageAt(100 + STICKY_VH - TAIL_VH),
  passageAt(100 + STICKY_VH + 50),
];
/** 镜头推近时追光慢慢亮起，推到跟前全亮，最后一种动画结束后熄灯。 */
const SPOTLIGHT_LEVELS = [0, 0.25, 1, 1, 0];

/** 对焦环跟手的阻尼：比滚动略慢半拍，像有分量的金属环。 */
const RING_SPRING = { stiffness: 240, damping: 32, mass: 0.6 } as const;

const stickyAt = (vh: number) => vh / STICKY_VH;
const approachAt = (fraction: number) => stickyAt(APPROACH_VH * fraction);
/** 吸顶进度 → 节目单上的连续位置：整数正好是某种动画演到一半。 */
const toModePosition = (progress: number) =>
  Math.min(MODE_COUNT - 1, Math.max(0, (progress * STICKY_VH - APPROACH_VH) / MODE_VH - 0.5));

/**
 * 歌词舞台的滚动编排：镜头从远处推近舞台（远处只是一片虚着的光，推近时对焦、铺满整屏）、驱动声场里的追光，按 14 种动画的顺序逐一切换，
 * 同时给出对焦环的转动位置，并提供点选某种动画时滚动到它所在位置的跳转。
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

  const modePosition = useTransform(scrollYProgress, toModePosition);
  useMotionValueEvent(modePosition, "change", (value) => setModeIndex(Math.round(value)));
  const ringPosition = useSpring(useTransform(modePosition, focusRingDetent), RING_SPRING);

  // 吸顶之前章节正从屏幕底部升上来，与前奏叠在一起，这段时间整座舞台都不可见。
  const stageOpacity = useScrollTransform(
    scrollYProgress,
    [0, approachAt(0.22), stickyAt(STICKY_VH - TAIL_VH * 0.6), 1],
    [0, 1, 1, 0],
  );
  const stageScale = useTransform(scrollYProgress, (value) =>
    prefersReducedMotion
      ? 1
      : approachScale(easeInOut((value * STICKY_VH) / APPROACH_VH), DISTANT_SCALE, 1),
  );
  // 远处的舞台没有台框：只是一片被照亮的光，软边从中间一小片一路铺到整屏，铺满后撤掉遮罩。
  const stageMask = useTransform(scrollYProgress, (value) => {
    const approach = easeInOut((value * STICKY_VH) / APPROACH_VH);
    if (approach >= 0.98) return "none";
    const radius = STAGE_MASK_FROM + approach * (STAGE_MASK_TO - STAGE_MASK_FROM);
    return `radial-gradient(ellipse ${radius}% ${radius * 0.8}% at 50% ${STAGE_FOCUS_Y}%, #000 40%, transparent 100%)`;
  });
  // 远处是虚的，推近的前半程对上焦；对上之后撤掉滤镜。
  const stageFilter = useTransform(scrollYProgress, (value) => {
    const focus = clamp01((value * STICKY_VH) / (APPROACH_VH * FOCUS_AT));
    return focus >= 1 ? "none" : `blur(${((1 - focus) * DISTANT_BLUR).toFixed(2)}px)`;
  });
  const poolOpacity = useScrollTransform(
    scrollYProgress,
    [approachAt(0.5), approachAt(0.95)],
    [1, 0],
  );

  const headingOpacity = useScrollTransform(
    scrollYProgress,
    [0, approachAt(0.2), approachAt(0.45), approachAt(0.68)],
    [0, 1, 1, 0],
  );
  const headingY = useScrollTransform(
    scrollYProgress,
    [approachAt(0.45), approachAt(0.75)],
    ["0vh", "-9vh"],
  );
  const headingScale = useScrollTransform(
    scrollYProgress,
    [approachAt(0.45), approachAt(0.75)],
    [1, prefersReducedMotion ? 1 : 1.14],
  );
  const headingFilter = useScrollTransform(
    scrollYProgress,
    [approachAt(0.45), approachAt(0.68)],
    ["blur(0px)", "blur(10px)"],
  );

  const ringStops = [approachAt(0.85), approachAt(1), stickyAt(STICKY_VH - TAIL_VH * 0.6), 1];
  const ringOpacity = useScrollTransform(scrollYProgress, ringStops, [0, 1, 1, 0]);
  const ringPointerEvents = useTransform(scrollYProgress, (value): string =>
    value > ringStops[0]! && value < ringStops[2]! ? "auto" : "none",
  );

  const jumpToMode = useCallback(
    (index: number) => {
      const section = sectionRef.current;
      if (!section) return;
      const sectionTop = section.getBoundingClientRect().top + window.scrollY;
      // 落在这一档正中，对焦环正好对准、名字完全清晰。
      const intoSection = APPROACH_VH + index * MODE_VH + MODE_VH * 0.5;
      scrollPageTo(sectionTop + (intoSection / 100) * window.innerHeight, prefersReducedMotion);
    },
    [prefersReducedMotion, sectionRef],
  );

  return {
    headingFilter,
    headingOpacity,
    headingScale,
    headingY,
    jumpToMode,
    modeIndex,
    ringOpacity,
    ringPointerEvents,
    ringPosition,
    poolOpacity,
    stageFilter,
    stageMask,
    stageOpacity,
    stageScale,
  };
}
