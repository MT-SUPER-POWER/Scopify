"use client";

import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";

import { LANDING_FOLIA_THEME } from "@/constants/marketing";
import type { LandingCinematicTimeline } from "@/types/marketing";

const FoliaSonnet = dynamic(
  () =>
    import("@folia/components/visualizer/sonnet/VisualizerSonnet").then((module) => module.default),
  { ssr: false },
);

const FoliaDiorama = dynamic(
  () =>
    import("@folia/components/visualizer/diorama/VisualizerDiorama").then(
      (module) => module.default,
    ),
  { ssr: false },
);

const FoliaPartita = dynamic(
  () =>
    import("@folia/components/visualizer/partita/VisualizerPartita").then(
      (module) => module.default,
    ),
  { ssr: false },
);

interface FoliaCinematicRendererProps {
  className?: string;
  coverUrl: string;
  timeline: LandingCinematicTimeline;
}

export function FoliaCinematicRenderer({
  className = "",
  coverUrl,
  timeline,
}: FoliaCinematicRendererProps) {
  const sharedProps = {
    currentTime: timeline.currentTime,
    currentLineIndex: timeline.currentLineIndex,
    lines: timeline.lines,
    theme: LANDING_FOLIA_THEME,
    audioPower: timeline.audioPower,
    audioBands: timeline.audioBands,
    background: { transparent: true },
    coverUrl,
    seed: `scopify-landing-${timeline.mode}`,
    showText: true,
    paused: true,
    staticMode: false,
    isPreviewMode: true,
    isPlayerChromeHidden: true,
    hideTranslationSubtitle: true,
    showSubtitleTranslation: false,
    subtitleContentMode: "none" as const,
    lyricsFontScale: 0.96,
    songTitle: "Scopify",
    songArtist: "Folia",
  };

  return (
    <div
      className={`relative size-full overflow-hidden ${className}`.trim()}
      data-folia-cinematic-mode={timeline.mode}
    >
      <AnimatePresence mode="sync" initial={false}>
        <motion.div
          key={timeline.mode}
          className="absolute inset-0"
          initial={{ opacity: 0, scale: 1.025, filter: "blur(12px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          exit={{ opacity: 0, scale: 0.985, filter: "blur(10px)" }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        >
          {timeline.mode === "sonnet" && <FoliaSonnet {...sharedProps} />}
          {timeline.mode === "diorama" && <FoliaDiorama {...sharedProps} />}
          {timeline.mode === "partita" && <FoliaPartita {...sharedProps} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
