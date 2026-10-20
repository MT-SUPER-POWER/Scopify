"use client";

import { useState } from "react";

import scopifyLogo from "@/assets/logo.png";
import { FoliaVisualizerRenderer } from "@/components/marketing/folia-visualizer-renderer";
import { useLandingSonnetTimeline } from "@/hooks/use-landing-sonnet-timeline";
import { renderSoundFieldCover } from "@/lib/marketing/sound-field-cover";

interface LandingLiveStageProps {
  lyricsFontScale: number;
  mode: string;
  paused: boolean;
}

/**
 * 在网页里实时运行的 Folia 歌词动画；背景透明，直接落在落地页自己的声场与追光上。
 * 需要封面的动画拿到的是声场着色器的一帧定格，取不到时退回 Logo。
 */
export function LandingLiveStage({ lyricsFontScale, mode, paused }: LandingLiveStageProps) {
  const timeline = useLandingSonnetTimeline(paused);
  const [coverUrl] = useState(() => renderSoundFieldCover() ?? scopifyLogo.src);

  return (
    // 切换模式时重新挂载，避免不同动画之间残留画布状态。
    <FoliaVisualizerRenderer
      key={mode}
      coverUrl={coverUrl}
      lyricsFontScale={lyricsFontScale}
      mode={mode}
      reducedMotion={paused}
      showText
      timeline={timeline}
    />
  );
}
