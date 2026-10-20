"use client";

import { motion } from "framer-motion";
import { useMemo, useState } from "react";

import scopifyLogo from "@/assets/logo.png";
import { FoliaVisualizerRenderer } from "@/components/marketing/folia-visualizer-renderer";
import { LANDING_STAGE_SCENES } from "@/constants/landing-stage";
import { useLandingStageTimeline } from "@/hooks/use-landing-stage-timeline";
import { buildStageLines } from "@/lib/marketing/landing-stage-timeline";
import { renderSoundFieldCover } from "@/lib/marketing/sound-field-cover";

const EASE = [0.22, 1, 0.36, 1] as const;

interface LandingLiveStageProps {
  lyricsFontScale: number;
  mode: string;
  paused: boolean;
}

/**
 * 在网页里实时运行的 Folia 歌词动画；背景透明，直接落在落地页自己的声场与追光上。
 * 每种动画唱自己那一场的词、用自己的颜色；换场时新的一场从失焦里对上焦，而不是硬切。
 * 需要封面的动画拿到的是声场着色器的一帧定格，取不到时退回 Logo。
 */
export function LandingLiveStage({ lyricsFontScale, mode, paused }: LandingLiveStageProps) {
  const scene = LANDING_STAGE_SCENES[mode];
  const lines = useMemo(() => buildStageLines(mode, scene?.verse ?? []), [mode, scene]);
  const timeline = useLandingStageTimeline(lines, paused);
  const [coverUrl] = useState(() => renderSoundFieldCover() ?? scopifyLogo.src);

  return (
    // 切换模式时重新挂载，避免不同动画之间残留画布状态。
    <motion.div
      key={mode}
      className="absolute inset-0"
      initial={paused ? { opacity: 0 } : { opacity: 0, scale: 1.05, filter: "blur(14px)" }}
      animate={{ opacity: 1, scale: 1, filter: "blur(0px)", transitionEnd: { filter: "none" } }}
      transition={{ duration: 0.8, ease: EASE }}
    >
      <FoliaVisualizerRenderer
        accentColor={scene?.accent}
        coverUrl={coverUrl}
        lyricsFontScale={lyricsFontScale}
        mode={mode}
        reducedMotion={paused}
        showText
        timeline={timeline}
      />
    </motion.div>
  );
}
