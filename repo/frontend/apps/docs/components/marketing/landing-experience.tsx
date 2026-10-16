import { LandingDay } from "@/components/marketing/landing-day";
import { LandingFavorites } from "@/components/marketing/landing-favorites";
import { LandingFilmWall } from "@/components/marketing/landing-film-wall";
import { LandingFinale } from "@/components/marketing/landing-finale";
import { LandingHero } from "@/components/marketing/landing-hero";
import { LandingVisualizers } from "@/components/marketing/landing-visualizers";

/** 落地页沿用听歌报告的叙事结构：首屏故事 → 常用功能 → 一天的时刻 → 歌词动画 → 底片墙 → 收尾。 */
export function LandingExperience() {
  return (
    <div className="relative isolate bg-[#070912] text-white">
      <LandingHero />
      <div className="flex flex-col gap-20 pt-8 sm:gap-28">
        <LandingFavorites />
        <LandingDay />
        <LandingVisualizers />
        <LandingFilmWall />
        <LandingFinale />
      </div>
    </div>
  );
}
