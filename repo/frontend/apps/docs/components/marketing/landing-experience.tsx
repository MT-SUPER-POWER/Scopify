import { LandingAtmosphereProvider } from "@/components/marketing/landing-atmosphere-provider";
import { LandingDay } from "@/components/marketing/landing-day";
import { LandingFilmWall } from "@/components/marketing/landing-film-wall";
import { LandingFinale } from "@/components/marketing/landing-finale";
import { LandingHeader } from "@/components/marketing/landing-header";
import { LandingHero } from "@/components/marketing/landing-hero";
import { LandingLyricsStage } from "@/components/marketing/landing-lyrics-stage";
import { LandingMiniPlayer } from "@/components/marketing/landing-mini-player";
import { LandingSound } from "@/components/marketing/landing-sound";
import { LandingSoundField } from "@/components/marketing/landing-sound-field";
import { LandingThemes } from "@/components/marketing/landing-themes";
import { landingSerifFont } from "@/lib/marketing/landing-fonts";

/**
 * 整页当作一首歌来写：前奏 → 主歌 → 副歌 → 桥段 → 变奏 → 回声 → 尾声。
 * 背后是一张随章节换色的 WebGL 声场，底部的迷你播放器把滚动位置显示成播放进度。
 */
export function LandingExperience() {
  return (
    <LandingAtmosphereProvider>
      <div className={`${landingSerifFont.variable} relative isolate text-white`}>
        <LandingSoundField />
        <LandingHeader />
        <LandingHero />
        <LandingLyricsStage />
        <LandingSound />
        <LandingDay />
        <LandingThemes />
        <LandingFilmWall />
        <LandingFinale />
        <LandingMiniPlayer />
      </div>
    </LandingAtmosphereProvider>
  );
}
