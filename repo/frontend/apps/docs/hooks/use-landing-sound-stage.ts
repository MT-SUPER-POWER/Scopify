"use client";

import { useMotionValue, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { type RefObject, useEffect } from "react";

import { LANDING_PIN_MEDIA_QUERY, LANDING_QUALITY_TIERS } from "@/constants/marketing";
import { useMediaQuery } from "@/hooks/use-media-query";
import { clamp01, easeInOut } from "@/lib/marketing/landing-stage-camera";

const STEP_COUNT = LANDING_QUALITY_TIERS.length - 1;
/** 吸顶后先由一枚竖着的胶囊放大铺满整屏、再化开露出这一章所占的滚动距离（vh）。 */
const ENTRY_VH = 90;
/** 胶囊在入场段的前多少比例里放大到铺满整屏，剩下的用来化开。 */
const PORTAL_GROW_END = 0.72;
/** 吸顶后先让「标准」亮一会儿，再开始往上爬（vh）。 */
const FILL_LEAD_VH = 10;
/** 每升一档占的滚动距离（vh）。 */
const STEP_VH = 18;
/** 爬到「超清母带」后停留的距离（vh）。 */
const HOLD_VH = 40;
/** 退场所占的滚动距离（vh）：这一屏往后退、淡出，下一章同时从底部升上来盖住它。 */
export const SOUND_STAGE_EXIT_VH = 100;
const FILL_START_VH = ENTRY_VH + FILL_LEAD_VH;
const FILL_END_VH = FILL_START_VH + STEP_COUNT * STEP_VH;
const STICKY_VH = FILL_END_VH + HOLD_VH + SOUND_STAGE_EXIT_VH;
/** 吸顶时整个章节的高度：吸顶滚动距离再加一屏。 */
export const SOUND_STAGE_SECTION_VH = STICKY_VH + 100;
/** 单栏时阶梯钉住的那段里，先停一会儿再爬、爬到顶再停一会儿所占的比例。 */
const TRACK_LEAD = 0.12;
const TRACK_HOLD = 0.15;

/**
 * 副歌的滚动编排。屏幕够大时整屏钉住：先是一枚胶囊从下方升上来、放大铺满整屏后化开，
 * 露出这一章；往下滚音质阶梯一档档爬到「超清母带」，停一下，再整体后退淡出、交给下一章。
 * 屏幕放不下时没有胶囊：单栏（手机、竖屏平板）只把标题和阶梯钉住，滚动用来爬音质；
 * 宽屏但不够高时照常滚过，阶梯按自己在视口里的位置点亮。
 */
export function useLandingSoundStage(
  sectionRef: RefObject<HTMLElement | null>,
  ladderRef: RefObject<HTMLElement | null>,
  ladderTrackRef: RefObject<HTMLElement | null>,
) {
  const isPinned = useMediaQuery(LANDING_PIN_MEDIA_QUERY);
  const isSingleColumn = !useMediaQuery("(min-width: 64rem)");
  const prefersReducedMotion = useReducedMotion() ?? false;
  const pinned = useMotionValue(isPinned ? 1 : 0);
  const singleColumn = useMotionValue(isSingleColumn ? 1 : 0);
  // 减少动态效果时不演胶囊：入场段只是多停一会儿，内容一直可见。
  const portalOn = useMotionValue(isPinned && !prefersReducedMotion ? 1 : 0);
  useEffect(() => pinned.set(isPinned ? 1 : 0), [isPinned, pinned]);
  useEffect(() => singleColumn.set(isSingleColumn ? 1 : 0), [isSingleColumn, singleColumn]);
  useEffect(
    () => portalOn.set(isPinned && !prefersReducedMotion ? 1 : 0),
    [isPinned, portalOn, prefersReducedMotion],
  );

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end end"] });
  const { scrollYProgress: flowFill } = useScroll({
    target: ladderRef,
    offset: ["start 85%", "end 45%"],
  });
  const { scrollYProgress: trackFill } = useScroll({
    target: ladderTrackRef,
    offset: ["start 64px", "end end"],
  });

  /** 阶梯点亮的比例，0 是「标准」，1 是「超清母带」。 */
  const fill = useTransform(
    [scrollYProgress, flowFill, trackFill, pinned, singleColumn],
    ([progress, flow, track, isOn, isSingle]: number[]) => {
      if (isOn) {
        return clamp01((progress! * STICKY_VH - FILL_START_VH) / (FILL_END_VH - FILL_START_VH));
      }
      return isSingle ? clamp01((track! - TRACK_LEAD) / (1 - TRACK_LEAD - TRACK_HOLD)) : flow!;
    },
  );
  /** 胶囊入场的进度：0 是刚吸顶，1 是胶囊已经化开。不演胶囊时恒为 1。 */
  const entry = useTransform([scrollYProgress, portalOn], ([progress, isOn]: number[]) =>
    isOn ? clamp01((progress! * STICKY_VH) / ENTRY_VH) : 1,
  );
  const exit = useTransform([scrollYProgress, pinned], ([progress, isOn]: number[]) =>
    isOn
      ? clamp01((progress! * STICKY_VH - (STICKY_VH - SOUND_STAGE_EXIT_VH)) / SOUND_STAGE_EXIT_VH)
      : 0,
  );

  /** 胶囊放大的比例：0 是竖着的一枚胶囊，1 是铺满整屏的直角面板。 */
  const portalGrow = useTransform(entry, (value) => easeInOut(value / PORTAL_GROW_END));
  const portalWidth = useTransform(portalGrow, (g) => `calc(7.5rem + ${g} * (100vw - 7.5rem))`);
  const portalHeight = useTransform(portalGrow, (g) => `calc(54svh + ${g} * 46svh)`);
  const portalRadius = useTransform(portalGrow, (g) => `${(1 - g) * 3.75}rem`);
  const portalOpacity = useTransform(entry, [PORTAL_GROW_END, 1], [1, 0]);
  /** 胶囊里的字：随胶囊放大一路推近、散开，像镜头穿过它进入下一章。 */
  const portalLabelScale = useTransform(portalGrow, [0, 1], [1, 3.4]);
  const portalLabelOpacity = useTransform(portalGrow, [0.25, 0.85], [1, 0]);
  const portalEcho = useTransform(portalGrow, [0, 1], [0, 1]);

  const contentOpacity = useTransform([entry, exit], ([entered, exited]: number[]) =>
    Math.min(clamp01((entered! - PORTAL_GROW_END) / (1 - PORTAL_GROW_END)), 1 - exited! / 0.85),
  );
  const contentScale = useTransform(exit, [0, 1], [1, 0.9]);
  const contentY = useTransform(exit, [0, 1], ["0vh", "-6vh"]);
  // 不退场时不挂滤镜：滤镜会让均衡器面板的毛玻璃取不到背后的声场。
  const contentFilter = useTransform(exit, (value) =>
    value > 0.01 ? `blur(${(value * 10).toFixed(2)}px)` : "none",
  );

  return {
    contentFilter,
    contentOpacity,
    contentScale,
    contentY,
    fill,
    portal: {
      echo: portalEcho,
      height: portalHeight,
      labelOpacity: portalLabelOpacity,
      labelScale: portalLabelScale,
      opacity: portalOpacity,
      radius: portalRadius,
      width: portalWidth,
    },
  };
}
