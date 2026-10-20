import { LandingChapterLabel } from "@/components/marketing/landing-chapter-label";
import { LandingEqualizer } from "@/components/marketing/landing-equalizer";
import { LandingQualityLadder } from "@/components/marketing/landing-quality-ladder";
import { LandingReveal } from "@/components/marketing/landing-reveal";
import {
  LANDING_EQ_BANDS,
  LANDING_QUALITY_TIERS,
  LANDING_SOUND_EFFECTS,
} from "@/constants/marketing";

/** 副歌：音质阶梯 + 可以上手推的十段均衡器。 */
export function LandingSound() {
  return (
    <section
      data-landing-chapter="chorus"
      aria-labelledby="landing-sound-title"
      className="relative mx-auto flex min-h-svh w-full max-w-360 flex-col justify-center px-5 py-32 sm:px-8 lg:px-12"
    >
      <LandingReveal>
        <LandingChapterLabel chapter="chorus" />
        <h2
          id="landing-sound-title"
          className="landing-display mt-6 text-[clamp(2.2rem,5.4vw,4.6rem)] leading-[1.08] font-semibold tracking-[-0.04em] text-white"
        >
          {LANDING_QUALITY_TIERS.length} 档音质，
          <br />
          <span className="text-white/45">{LANDING_EQ_BANDS.length} 段均衡。</span>
        </h2>
        <p className="mt-5 max-w-md text-sm leading-7 text-white/55 sm:text-base">
          从标准一路到超清母带；再交给均衡器，和一点点黑胶噪声。
        </p>
      </LandingReveal>

      <div className="mt-16 grid items-center gap-14 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] lg:gap-20">
        <LandingQualityLadder />
        <LandingReveal delay={0.1}>
          <LandingEqualizer />
          <ul aria-label="音色效果" className="mt-5 flex flex-wrap gap-2">
            {LANDING_SOUND_EFFECTS.map((effect) => (
              <li
                key={effect}
                className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/50"
              >
                {effect}
              </li>
            ))}
          </ul>
        </LandingReveal>
      </div>
    </section>
  );
}
