import { CURVED_CARD_LIFT, placeOnCylinder } from "@/lib/marketing/curved-track";
import type { LandingDayIntroProps } from "@/types/marketing";

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
      <h2
        id="landing-day-title"
        className="landing-display text-[clamp(2.2rem,4.6vw,4rem)] leading-[1.12] font-semibold tracking-[-0.04em] text-white"
      >
        从清晨到深夜，
        <br />
        都有你的听法。
      </h2>
      <p className="mt-5 text-sm leading-7 text-white/55 sm:text-base">
        有时把选歌交给 FM，有时让歌词留在桌面。
        <br />
        发现、专注、沉浸，让音乐跟上你的日常。
      </p>
      <p className="mt-10 font-mono text-[0.68rem] tracking-[0.2em] text-white/35 uppercase">
        继续向下滚动 →
      </p>
    </div>
  );
}
