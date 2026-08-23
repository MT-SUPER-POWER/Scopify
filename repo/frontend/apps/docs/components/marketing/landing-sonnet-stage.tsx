"use client";

import { motion, useReducedMotion } from "framer-motion";

import foliaStageScreenshot from "@/assets/features/lyrics-folia-stage.png";
import { FoliaLatentBackground } from "@/components/marketing/folia-latent-background";
import { FoliaPartitaRenderer } from "@/components/marketing/folia-partita-renderer";
import { FoliaSonnetRenderer } from "@/components/marketing/folia-sonnet-renderer";
import { LANDING_FOLIA_THEME } from "@/constants/marketing";
import { useLandingPartitaTimeline } from "@/hooks/use-landing-partita-timeline";
import { useLandingSonnetTimeline } from "@/hooks/use-landing-sonnet-timeline";
import type { LandingScene } from "@/types/marketing";

interface LandingSonnetStageProps {
  scene: LandingScene;
}

export function LandingSonnetStage({ scene }: LandingSonnetStageProps) {
  const prefersReducedMotion = useReducedMotion() ?? false;
  const timeline = useLandingSonnetTimeline(prefersReducedMotion);
  const isIntro = scene === "intro";
  const partitaTimeline = useLandingPartitaTimeline(isIntro, prefersReducedMotion);
  const isPerformance = scene === "performance";
  const isFragments = scene === "fragments";
  const isInterface = scene === "interface";
  const isEpilogue = scene === "epilogue";
  const showText = isPerformance || isFragments;
  const sonnetOpacity = isIntro
    ? 0
    : isPerformance
      ? 1
      : isFragments
        ? 0.86
        : isInterface
          ? 0.1
          : 0.28;
  const stageBlur = isInterface ? 18 : isEpilogue ? 5 : 0;
  const veilOpacity = isIntro
    ? 0.16
    : isPerformance
      ? 0.05
      : isFragments
        ? 0.14
        : isInterface
          ? 0.72
          : 0.54;

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[#070912]">
      <FoliaLatentBackground coverUrl={foliaStageScreenshot.src} theme={LANDING_FOLIA_THEME} />
      <div
        className="absolute inset-0 transition-colors duration-1000"
        style={{ backgroundColor: `rgba(2,3,7,${veilOpacity})` }}
      />
      <motion.div
        aria-hidden={!isIntro}
        className="absolute inset-0 z-20 origin-center max-sm:scale-[0.84]"
        initial={
          prefersReducedMotion || partitaTimeline.isSettled ? false : { opacity: 0, scale: 0.97 }
        }
        animate={{ opacity: isIntro ? 0.96 : 0, scale: isIntro ? 1 : 1.025 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        <FoliaPartitaRenderer
          coverUrl={foliaStageScreenshot.src}
          reducedMotion={prefersReducedMotion}
          timeline={partitaTimeline}
        />
      </motion.div>
      <div
        className="absolute inset-0 z-10 origin-center transition-[opacity,transform,filter] duration-1000 ease-out max-sm:scale-[0.88]"
        style={{
          filter: `blur(${stageBlur}px)`,
          opacity: sonnetOpacity,
          transform: `scale(${isInterface ? 1.04 : 1})`,
        }}
      >
        <FoliaSonnetRenderer
          coverUrl={foliaStageScreenshot.src}
          reducedMotion={prefersReducedMotion}
          showText={showText}
          timeline={timeline}
        />
      </div>
      <div className="landing-grain absolute inset-0" />
    </div>
  );
}
