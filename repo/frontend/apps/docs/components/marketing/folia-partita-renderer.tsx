"use client";

import dynamic from "next/dynamic";

import { LANDING_FOLIA_THEME } from "@/constants/marketing";
import type { LandingFoliaTimeline } from "@/types/marketing";

const FoliaPartita = dynamic(
  () =>
    import("@folia/components/visualizer/partita/VisualizerPartita").then(
      (module) => module.default,
    ),
  { ssr: false },
);

interface FoliaPartitaRendererProps {
  coverUrl: string;
  reducedMotion: boolean;
  timeline: LandingFoliaTimeline;
}

export function FoliaPartitaRenderer({
  coverUrl,
  reducedMotion,
  timeline,
}: FoliaPartitaRendererProps) {
  return (
    <div className="absolute inset-0 overflow-hidden" data-folia-landing-mode="partita">
      <FoliaPartita
        currentTime={timeline.currentTime}
        currentLineIndex={timeline.currentLineIndex}
        lines={timeline.lines}
        theme={LANDING_FOLIA_THEME}
        audioPower={timeline.audioPower}
        audioBands={timeline.audioBands}
        background={{ transparent: true }}
        coverUrl={coverUrl}
        seed="scopify-landing-partita"
        showText
        paused={reducedMotion}
        staticMode={reducedMotion}
        isPreviewMode
        isPlayerChromeHidden
        hideTranslationSubtitle
        showSubtitleTranslation={false}
        subtitleContentMode="none"
        lyricsFontScale={1.06}
        partitaTuning={{
          showGuideLines: true,
          useSemanticLayout: true,
          staggerMin: 28,
          staggerMax: 88,
        }}
        songTitle="Scopify"
        songArtist="Folia"
      />
    </div>
  );
}
