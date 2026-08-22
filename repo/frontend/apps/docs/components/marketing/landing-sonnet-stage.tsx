"use client";

import { useReducedMotion } from "framer-motion";

import foliaStageScreenshot from "@/assets/features/lyrics-folia-stage.png";
import { FoliaLatentBackground } from "@/components/marketing/folia-latent-background";
import { FoliaSonnetRenderer } from "@/components/marketing/folia-sonnet-renderer";
import { LANDING_FOLIA_THEME } from "@/constants/marketing";
import { useLandingSonnetTimeline } from "@/hooks/use-landing-sonnet-timeline";
import type { LandingScene } from "@/types/marketing";

interface LandingSonnetStageProps {
  scene: LandingScene;
}

export function LandingSonnetStage({ scene }: LandingSonnetStageProps) {
  const prefersReducedMotion = useReducedMotion() ?? false;
  const timeline = useLandingSonnetTimeline(prefersReducedMotion);
  const isPerformance = scene === "performance";
  const isFragments = scene === "fragments";
  const isInterface = scene === "interface";
  const isEpilogue = scene === "epilogue";
  const showText = isPerformance || isFragments;
  const stageOpacity = isPerformance ? 1 : isFragments ? 0.86 : isInterface ? 0.1 : 0.28;
  const stageBlur = isInterface ? 18 : isEpilogue ? 5 : 0;
  const veilOpacity = isPerformance ? 0.05 : isFragments ? 0.14 : isInterface ? 0.72 : 0.54;

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[#070912]">
      <FoliaLatentBackground coverUrl={foliaStageScreenshot.src} theme={LANDING_FOLIA_THEME} />
      <div
        className="absolute inset-0 origin-center transition-[opacity,transform,filter] duration-1000 ease-out max-sm:scale-[0.88]"
        style={{
          filter: `blur(${stageBlur}px)`,
          opacity: stageOpacity,
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
      <div
        className="absolute inset-0 transition-colors duration-1000"
        style={{ backgroundColor: `rgba(2,3,7,${veilOpacity})` }}
      />
      <div className="landing-grain absolute inset-0" />
    </div>
  );
}
