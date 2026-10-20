"use client";

import { useMotionValue, useScroll, useTransform } from "framer-motion";
import { type RefObject, useEffect } from "react";

import { LANDING_PIN_MEDIA_QUERY, LANDING_QUALITY_TIERS } from "@/constants/marketing";
import { useMediaQuery } from "@/hooks/use-media-query";
import { clamp01 } from "@/lib/marketing/landing-stage-camera";

const STEP_COUNT = LANDING_QUALITY_TIERS.length - 1;
/** 吸顶后先让「标准」亮一会儿，再开始往上爬（vh）。 */
const FILL_LEAD_VH = 10;
/** 每升一档占的滚动距离（vh）。 */
const STEP_VH = 18;
/** 爬到「超清母带」后停留的距离（vh）。 */
const HOLD_VH = 40;
/** 退场所占的滚动距离（vh）：这一屏往后退、淡出，下一章同时从底部升上来盖住它。 */
export const SOUND_STAGE_EXIT_VH = 100;
const FILL_END_VH = FILL_LEAD_VH + STEP_COUNT * STEP_VH;
const STICKY_VH = FILL_END_VH + HOLD_VH + SOUND_STAGE_EXIT_VH;
/** 吸顶时整个章节的高度：吸顶滚动距离再加一屏。 */
export const SOUND_STAGE_SECTION_VH = STICKY_VH + 100;

/**
 * 副歌的滚动编排。屏幕够大时整屏钉住：往下滚音质阶梯一档档爬到「超清母带」，
 * 停一下，再整体后退淡出、交给下一章；屏幕放不下时照常滚过，阶梯按自己在视口里的位置点亮。
 */
export function useLandingSoundStage(
  sectionRef: RefObject<HTMLElement | null>,
  ladderRef: RefObject<HTMLElement | null>,
) {
  const isPinned = useMediaQuery(LANDING_PIN_MEDIA_QUERY);
  const pinned = useMotionValue(isPinned ? 1 : 0);
  useEffect(() => pinned.set(isPinned ? 1 : 0), [isPinned, pinned]);

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end end"] });
  const { scrollYProgress: flowFill } = useScroll({
    target: ladderRef,
    offset: ["start 85%", "end 45%"],
  });

  /** 阶梯点亮的比例，0 是「标准」，1 是「超清母带」。 */
  const fill = useTransform(
    [scrollYProgress, flowFill, pinned],
    ([progress, flow, isOn]: number[]) =>
      isOn ? clamp01((progress! * STICKY_VH - FILL_LEAD_VH) / (FILL_END_VH - FILL_LEAD_VH)) : flow!,
  );
  const exit = useTransform([scrollYProgress, pinned], ([progress, isOn]: number[]) =>
    isOn
      ? clamp01((progress! * STICKY_VH - (STICKY_VH - SOUND_STAGE_EXIT_VH)) / SOUND_STAGE_EXIT_VH)
      : 0,
  );
  const contentOpacity = useTransform(exit, [0, 0.85], [1, 0]);
  const contentScale = useTransform(exit, [0, 1], [1, 0.9]);
  const contentY = useTransform(exit, [0, 1], ["0vh", "-6vh"]);
  // 不退场时不挂滤镜：滤镜会让均衡器面板的毛玻璃取不到背后的声场。
  const contentFilter = useTransform(exit, (value) =>
    value > 0.01 ? `blur(${(value * 10).toFixed(2)}px)` : "none",
  );

  return { contentFilter, contentOpacity, contentScale, contentY, fill };
}
