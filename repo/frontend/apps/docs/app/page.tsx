import type { Metadata } from "next";

import { LandingExperience } from "@/components/marketing/landing-experience";

export const metadata: Metadata = {
  title: "Scopify",
  description:
    "Scopify 是网易云音乐 × Folia 的开源桌面播放器：14 种歌词动画、9 档音质与 10 段均衡器，把每天听的歌听成自己的样子。",
};

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-x-clip bg-[#070912]">
      <LandingExperience />
    </main>
  );
}
