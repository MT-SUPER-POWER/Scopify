"use client";

import { LandingIntro } from "@/components/marketing/landing-intro";
import { LandingReveal } from "@/components/marketing/landing-reveal";
import { LandingSonnetStage } from "@/components/marketing/landing-sonnet-stage";
import { useLandingScene } from "@/hooks/use-landing-scene";

export function LandingExperience() {
  const { introRef, performanceRef, revealRef, scene } = useLandingScene();

  return (
    <div className="relative isolate bg-[#070912] text-white" data-landing-scene={scene}>
      <LandingSonnetStage scene={scene} />
      <div className="relative z-10">
        <LandingIntro sectionRef={introRef} />
        <section
          ref={performanceRef}
          aria-label="Folia 动态歌词演出"
          className="relative min-h-svh"
        />
        <LandingReveal sectionRef={revealRef} active={scene === "reveal"} />
      </div>
    </div>
  );
}
