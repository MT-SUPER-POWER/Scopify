"use client";

import { LandingIntro } from "@/components/marketing/landing-intro";
import { LandingEpilogue } from "@/components/marketing/landing-epilogue";
import { LandingFragments } from "@/components/marketing/landing-fragments";
import { LandingInterface } from "@/components/marketing/landing-interface";
import { LandingPerformance } from "@/components/marketing/landing-performance";
import { LandingSonnetStage } from "@/components/marketing/landing-sonnet-stage";
import { useLandingScene } from "@/hooks/use-landing-scene";

export function LandingExperience() {
  const { introRef, performanceRef, fragmentsRef, interfaceRef, epilogueRef, scene } =
    useLandingScene();

  return (
    <div className="relative isolate bg-[#070912] text-white" data-landing-scene={scene}>
      <LandingSonnetStage scene={scene} />
      <div className="relative z-10">
        <LandingIntro sectionRef={introRef} />
        <LandingPerformance sectionRef={performanceRef} active={scene === "performance"} />
        <LandingFragments sectionRef={fragmentsRef} active={scene === "fragments"} />
        <LandingInterface sectionRef={interfaceRef} />
        <LandingEpilogue sectionRef={epilogueRef} active={scene === "epilogue"} />
      </div>
    </div>
  );
}
