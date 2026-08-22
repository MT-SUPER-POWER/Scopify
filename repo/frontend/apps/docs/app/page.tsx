import type { Metadata } from "next";

import { LandingExperience } from "@/components/marketing/landing-experience";

export const metadata: Metadata = {
  title: "Scopify",
  description: "Scopify 用 Folia 让歌词成为一场视觉演出。",
};

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-x-clip bg-[#070912]">
      <LandingExperience />
    </main>
  );
}
