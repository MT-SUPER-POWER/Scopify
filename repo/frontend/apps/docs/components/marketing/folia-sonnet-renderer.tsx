"use client";

import dynamic from "next/dynamic";

import { LANDING_FOLIA_THEME } from "@/constants/marketing";
import type { LandingSonnetTimeline } from "@/types/marketing";

const FoliaSonnet = dynamic(
  () =>
    import("@folia/components/visualizer/sonnet/VisualizerSonnet").then((module) => module.default),
  { ssr: false },
);

interface FoliaSonnetRendererProps {
  coverUrl: string;
  reducedMotion: boolean;
  showText: boolean;
  timeline: LandingSonnetTimeline;
}

export function FoliaSonnetRenderer({
  coverUrl,
  reducedMotion,
  showText,
  timeline,
}: FoliaSonnetRendererProps) {
  return (
    <div className="absolute inset-0 overflow-hidden" data-folia-landing-mode="sonnet">
      <FoliaSonnet
        currentTime={timeline.currentTime}
        currentLineIndex={timeline.currentLineIndex}
        lines={timeline.lines}
        theme={LANDING_FOLIA_THEME}
        audioPower={timeline.audioPower}
        audioBands={timeline.audioBands}
        background={{ transparent: true }}
        coverUrl={coverUrl}
        seed="scopify-landing-sonnet"
        showText={showText}
        paused={reducedMotion}
        staticMode={reducedMotion}
        isPreviewMode
        isPlayerChromeHidden
        hideTranslationSubtitle
        showSubtitleTranslation={false}
        subtitleContentMode="none"
        lyricsFontScale={0.84}
        songTitle="Scopify"
        songArtist="Folia"
      />
    </div>
  );
}
