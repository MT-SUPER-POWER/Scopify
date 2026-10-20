"use client";

import { motion, useInView, useReducedMotion } from "framer-motion";
import { useRef } from "react";

import { LandingChapterLabel } from "@/components/marketing/landing-chapter-label";
import { LandingLiveStage } from "@/components/marketing/landing-live-stage";
import { LandingStageModes } from "@/components/marketing/landing-stage-modes";
import { LANDING_VISUALIZER_MODES } from "@/constants/marketing";
import { LYRICS_STAGE_SECTION_VH, useLyricsStage } from "@/hooks/use-lyrics-stage";
import { useMediaQuery } from "@/hooks/use-media-query";

/**
 * 主歌：一座被追光点亮的歌词舞台。进场时只有微光和一句标题，
 * 往下滚灯光全亮，14 种歌词动画按列表顺序从上到下逐一登场。
 */
export function LandingLyricsStage() {
  const sectionRef = useRef<HTMLElement>(null);
  const prefersReducedMotion = useReducedMotion() ?? false;
  const isWide = useMediaQuery("(min-width: 768px)");
  const isNear = useInView(sectionRef, { margin: "60% 0px" });
  const { headingOpacity, jumpToMode, modeIndex, stageOpacity } = useLyricsStage(sectionRef);
  const mode = LANDING_VISUALIZER_MODES[modeIndex]!.value;

  return (
    <section
      ref={sectionRef}
      data-landing-chapter="verse"
      aria-labelledby="landing-stage-title"
      className="relative"
      style={{ height: `${LYRICS_STAGE_SECTION_VH}vh` }}
    >
      <div className="sticky top-0 h-svh overflow-hidden">
        <motion.div
          className="absolute inset-x-0 top-[14svh] flex flex-col items-center px-5 text-center"
          style={{ opacity: headingOpacity }}
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

        <motion.div className="absolute inset-0" style={{ opacity: stageOpacity }}>
          {isNear ? (
            <LandingLiveStage
              mode={mode}
              paused={prefersReducedMotion}
              lyricsFontScale={isWide ? 0.9 : 0.62}
            />
          ) : null}
          <LandingStageModes modeIndex={modeIndex} onPick={jumpToMode} />
        </motion.div>
      </div>
    </section>
  );
}
