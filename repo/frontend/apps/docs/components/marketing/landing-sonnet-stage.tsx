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
  const isReveal = scene === "reveal";

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[#070912]">
      <FoliaLatentBackground coverUrl={foliaStageScreenshot.src} theme={LANDING_FOLIA_THEME} />
      <div
        className="absolute inset-0 origin-center transition-[opacity,transform,filter] duration-1000 ease-out max-sm:scale-[0.88]"
        style={{
          filter: isReveal ? "blur(16px)" : "blur(0px)",
          opacity: isPerformance ? 1 : isReveal ? 0.12 : 0.32,
          transform: `scale(${isReveal ? 1.035 : 1})`,
        }}
      >
        <FoliaSonnetRenderer
          coverUrl={foliaStageScreenshot.src}
          reducedMotion={prefersReducedMotion}
          showText={isPerformance}
          timeline={timeline}
        />
      </div>
      <div
        className="absolute inset-0 transition-colors duration-1000"
        style={{ backgroundColor: isPerformance ? "rgba(2,3,7,0.05)" : "rgba(2,3,7,0.54)" }}
      />
      <div className="landing-grain absolute inset-0" />
    </div>
  );
}
