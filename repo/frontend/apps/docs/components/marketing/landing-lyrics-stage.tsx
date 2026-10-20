"use client";

import { motion, useInView, useReducedMotion } from "framer-motion";
import { useRef } from "react";

import { LandingChapterLabel } from "@/components/marketing/landing-chapter-label";
import { LandingLiveStage } from "@/components/marketing/landing-live-stage";
import { LandingModeDial } from "@/components/marketing/landing-mode-dial";
import { LANDING_VISUALIZER_MODES } from "@/constants/marketing";
import {
  LYRICS_STAGE_ANCHOR_VH,
  LYRICS_STAGE_OVERLAP_VH,
  LYRICS_STAGE_SECTION_VH,
  STAGE_FOCUS_Y,
  useLyricsStage,
} from "@/hooks/use-lyrics-stage";
import { useMediaQuery } from "@/hooks/use-media-query";

/**
 * 主歌：一座被追光点亮的歌词舞台。镜头穿过前奏的窗口后，舞台先是远处一小片虚着的光，
 * 往下滚镜头一路推近，直到舞台铺满整屏、追光全亮，14 种歌词动画再按列表顺序逐一登场。
 */
export function LandingLyricsStage() {
  const sectionRef = useRef<HTMLElement>(null);
  const prefersReducedMotion = useReducedMotion() ?? false;
  const isWide = useMediaQuery("(min-width: 768px)");
  const isNear = useInView(sectionRef, { margin: "60% 0px" });
  const stage = useLyricsStage(sectionRef);
  const mode = LANDING_VISUALIZER_MODES[stage.modeIndex]!.value;

  return (
    <section
      ref={sectionRef}
      data-landing-chapter="verse"
      data-landing-chapter-anchor={LYRICS_STAGE_ANCHOR_VH}
      aria-labelledby="landing-stage-title"
      className="relative"
      style={{
        height: `${LYRICS_STAGE_SECTION_VH}vh`,
        marginTop: `-${LYRICS_STAGE_OVERLAP_VH}vh`,
      }}
    >
      <div className="sticky top-0 h-svh overflow-hidden">
        {/* 镜头推近：远处只是一小片被照亮、还没对上焦的歌词，没有台框；推近时对焦、光的软边一路铺满整屏。 */}
        <motion.div
          className="absolute inset-0"
          style={{
            opacity: stage.stageOpacity,
            scale: stage.stageScale,
            filter: stage.stageFilter,
            maskImage: stage.stageMask,
            WebkitMaskImage: stage.stageMask,
            transformOrigin: `50% ${STAGE_FOCUS_Y}%`,
          }}
        >
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 h-[60%] w-[80%] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(closest-side,rgba(200,214,255,0.11),transparent)]"
            style={{ opacity: stage.poolOpacity, top: `${STAGE_FOCUS_Y}%` }}
          />
          {isNear ? (
            <LandingLiveStage
              mode={mode}
              paused={prefersReducedMotion}
              lyricsFontScale={isWide ? 0.9 : 0.62}
            />
          ) : null}
        </motion.div>

        <motion.div
          className="pointer-events-none absolute inset-x-0 top-[14svh] flex flex-col items-center px-5 text-center"
          style={{
            opacity: stage.headingOpacity,
            y: stage.headingY,
            scale: stage.headingScale,
            filter: stage.headingFilter,
          }}
        >
          <LandingChapterLabel chapter="verse" />
          <h2
            id="landing-stage-title"
            className="landing-display mt-5 text-[clamp(1.9rem,4.4vw,3.8rem)] leading-[1.15] font-semibold tracking-[-0.035em] text-balance text-white"
          >
            每一句歌词，都换一种方式出场。
          </h2>
          <p className="mt-3 text-sm text-white/50 sm:text-base">
            {LANDING_VISUALIZER_MODES.length} 种歌词动画。往下滚，灯会亮起来。
          </p>
        </motion.div>

        {/* 立在最右侧边缘的齿轮就是节目单：舞台推到跟前才出现，熄灯时一起退场。 */}
        <motion.div
          className="absolute top-1/2 right-0 z-30 -translate-y-1/2"
          style={{ opacity: stage.ringOpacity, pointerEvents: stage.ringPointerEvents }}
        >
          <LandingModeDial
            modeIndex={stage.modeIndex}
            modePosition={stage.modePosition}
            onPick={stage.jumpToMode}
            onScrub={stage.scrubToPosition}
            onSettle={() => stage.jumpToMode(Math.round(stage.modePosition.get()))}
            position={stage.ringPosition}
          />
        </motion.div>
      </div>
    </section>
  );
}
