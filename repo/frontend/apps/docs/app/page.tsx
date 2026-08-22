import type { Metadata } from "next";

import foliaStageScreenshot from "@/assets/features/lyrics-folia-stage.png";
import { FoliaLatentBackground } from "@/components/marketing/folia-latent-background";
import { LandingCinematic } from "@/components/marketing/landing-cinematic";
import { LandingClosing } from "@/components/marketing/landing-closing";
import { LandingHeader } from "@/components/marketing/landing-header";
import { LANDING_FOLIA_THEME } from "@/constants/marketing";

export const metadata: Metadata = {
  title: "Scopify",
  description: "音乐发现、Folia 动态歌词与桌面体验，都在 Scopify。",
};

export default function HomePage() {
  return (
    <main className="relative isolate min-h-screen overflow-x-clip bg-[#06070b] text-white">
      <div className="pointer-events-none fixed inset-0 z-0">
        <FoliaLatentBackground coverUrl={foliaStageScreenshot.src} theme={LANDING_FOLIA_THEME} />
      </div>
      <div className="pointer-events-none fixed inset-0 z-0 bg-[linear-gradient(180deg,rgba(4,6,12,0.36)_0%,rgba(5,7,13,0.05)_42%,rgba(4,5,9,0.5)_100%)]" />
      <div className="landing-grain pointer-events-none fixed inset-0 z-0" />

      <div className="relative z-10">
        <LandingHeader />
        <LandingCinematic />
        <LandingClosing />
      </div>
    </main>
  );
}
