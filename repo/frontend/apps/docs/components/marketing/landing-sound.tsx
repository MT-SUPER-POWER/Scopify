"use client";

import { motion } from "framer-motion";
import { type CSSProperties, useRef } from "react";

import { LandingEqualizer } from "@/components/marketing/landing-equalizer";
import { LandingQualityLadder } from "@/components/marketing/landing-quality-ladder";
import { LandingReveal } from "@/components/marketing/landing-reveal";
import { LandingSoundPortal } from "@/components/marketing/landing-sound-portal";
import {
  LANDING_EQ_BANDS,
  LANDING_QUALITY_TIERS,
  LANDING_SOUND_EFFECTS,
} from "@/constants/marketing";
import { SOUND_STAGE_SECTION_VH, useLandingSoundStage } from "@/hooks/use-landing-sound-stage";

/**
 * 副歌：音质阶梯 + 可以上手推的十段均衡器。屏幕够大时整屏钉住，先穿过一枚胶囊入口，
 * 往下滚把阶梯一路推到「超清母带」，再后退淡出，让下一章从底部升上来。
 */
export function LandingSound() {
  const sectionRef = useRef<HTMLElement>(null);
  const ladderRef = useRef<HTMLDivElement>(null);
  const ladderTrackRef = useRef<HTMLDivElement>(null);
  const stage = useLandingSoundStage(sectionRef, ladderRef, ladderTrackRef);

  return (
    <section
      ref={sectionRef}
      data-landing-chapter="chorus"
      aria-labelledby="landing-sound-title"
      className="landing-pin:h-(--sound-section-h) relative"
      style={{ "--sound-section-h": `${SOUND_STAGE_SECTION_VH}vh` } as CSSProperties}
    >
      <div className="landing-pin:sticky landing-pin:top-0 landing-pin:h-svh landing-pin:overflow-hidden landing-pin:pt-16 landing-pin:pb-20 flex min-h-svh items-center">
        <LandingSoundPortal portal={stage.portal} />
        <motion.div
          className="landing-pin:py-0 mx-auto grid w-full max-w-360 items-center gap-14 px-5 py-32 sm:px-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-20 lg:px-12"
          style={{
            opacity: stage.contentOpacity,
            scale: stage.contentScale,
            y: stage.contentY,
            filter: stage.contentFilter,
          }}
        >
          {/* 单栏时把标题与阶梯钉在屏幕上，滚动只用来爬音质，爬到顶再放行给均衡器；
              钉住的高度扣掉顶栏和迷你播放器，阶梯不会被播放器压住。 */}
          <div ref={ladderTrackRef} className="max-lg:h-[220svh]">
            <div className="max-lg:sticky max-lg:top-16 max-lg:flex max-lg:h-[calc(100svh-9.5rem)] max-lg:flex-col max-lg:justify-center">
              <LandingReveal>
                <h2
                  id="landing-sound-title"
                  className="landing-display text-[clamp(2.2rem,4.4vw,3.8rem)] leading-[1.08] font-semibold tracking-[-0.04em] text-white"
                >
                  {LANDING_QUALITY_TIERS.length} 档音质，
                  <br />
                  <span className="text-white/45">{LANDING_EQ_BANDS.length} 段均衡。</span>
                </h2>
                <p className="mt-4 max-w-md text-sm leading-7 text-white/55 sm:text-base">
                  从标准一路到超清母带；再交给均衡器，和一点点黑胶噪声。
                </p>
              </LandingReveal>
              <div ref={ladderRef} className="landing-pin:mt-8 mt-14 max-lg:mt-6">
                <LandingQualityLadder fill={stage.fill} />
              </div>
            </div>
          </div>

          <LandingReveal delay={0.1}>
            <LandingEqualizer />
            {/* 与面板内边距对齐，胶囊整排正好落在推子那一栏的左右两端之间。 */}
            <ul
              aria-label="音色效果"
              className="mt-5 grid grid-cols-2 gap-2 px-5 sm:grid-cols-4 sm:px-7 2xl:grid-cols-8"
            >
              {LANDING_SOUND_EFFECTS.map((effect) => (
                <li
                  key={effect}
                  className="truncate rounded-full border border-white/10 px-2 py-1 text-center text-xs text-white/50"
                >
                  {effect}
                </li>
              ))}
            </ul>
          </LandingReveal>
        </motion.div>
      </div>
    </section>
  );
}
