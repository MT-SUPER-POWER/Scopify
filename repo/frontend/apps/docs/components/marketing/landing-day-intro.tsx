import { LandingChapterLabel } from "@/components/marketing/landing-chapter-label";
import { CURVED_CARD_LIFT, placeOnCylinder } from "@/lib/marketing/curved-track";
import type { LandingCurvedTrackLayout } from "@/types/marketing";

interface LandingDayIntroProps {
  layout: LandingCurvedTrackLayout;
}

/** 曲面屏最左侧的章节标题，和场景卡片贴在同一块内凹的屏幕上。 */
export function LandingDayIntro({ layout }: LandingDayIntroProps) {
  return (
    <div
      data-arc={layout.introCenter}
      className="absolute left-1/2 -translate-y-1/2 backface-hidden"
      style={{
        marginLeft: -layout.introWidth / 2,
        top: `calc(50% - ${CURVED_CARD_LIFT}px)`,
        transform: placeOnCylinder(layout.introCenter, layout.radius).transform,
        width: layout.introWidth,
      }}
    >
      <LandingChapterLabel chapter="bridge" />
      <h2
        id="landing-day-title"
        className="landing-display mt-6 text-[clamp(2.2rem,4.6vw,4rem)] leading-[1.12] font-semibold tracking-[-0.04em] text-white"
      >
        六个场景，
        <br />
        六种打开方式。
      </h2>
      <p className="mt-5 text-sm leading-7 text-white/55 sm:text-base">
        有时要一首歌开场，有时只想要一点安静。
      </p>
      <p className="mt-10 font-mono text-[0.68rem] tracking-[0.2em] text-white/35 uppercase">
        继续向下滚动 →
      </p>
    </div>
  );
}
