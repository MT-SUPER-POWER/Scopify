"use client";

import dynamic from "next/dynamic";

import { LANDING_FOLIA_THEME } from "@/constants/marketing";
import type { LandingFoliaTimeline } from "@/types/marketing";

const FoliaVisualizer = dynamic(
  () => import("@folia/components/visualizer/VisualizerRenderer").then((module) => module.default),
  { ssr: false },
);

interface FoliaVisualizerRendererProps {
  coverUrl: string;
  lyricsFontScale?: number;
  mode: string;
  reducedMotion: boolean;
  showText: boolean;
  timeline: LandingFoliaTimeline;
}

/** 与客户端共用 Folia 的歌词动画注册表，按 `mode` 渲染任意一种动画。 */
export function FoliaVisualizerRenderer({
  coverUrl,
  lyricsFontScale = 0.84,
  mode,
  reducedMotion,
  showText,
  timeline,
}: FoliaVisualizerRendererProps) {
  return (
    <div className="absolute inset-0 overflow-hidden" data-folia-landing-mode={mode}>
      <FoliaVisualizer
        mode={mode}
        currentTime={timeline.currentTime}
        currentLineIndex={timeline.currentLineIndex}
        lines={timeline.lines}
        theme={LANDING_FOLIA_THEME}
        audioPower={timeline.audioPower}
        audioBands={timeline.audioBands}
        background={{ transparent: true }}
        coverUrl={coverUrl}
        seed={`scopify-landing-${mode}`}
        showText={showText}
        paused={reducedMotion}
        staticMode={reducedMotion}
        isPreviewMode
        isPlayerChromeHidden
        hideTranslationSubtitle
        showSubtitleTranslation={false}
        subtitleContentMode="none"
        lyricsFontScale={lyricsFontScale}
        songTitle="Scopify"
        songArtist="Folia"
      />
    </div>
  );
}
