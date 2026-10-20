"use client";

import { motion, useInView, useScroll } from "framer-motion";
import { type CSSProperties, useRef } from "react";

import { LandingDayCard } from "@/components/marketing/landing-day-card";
import { LandingDayIntro } from "@/components/marketing/landing-day-intro";
import { LANDING_DAY_MOMENTS } from "@/constants/marketing";
import { useCurvedTrack } from "@/hooks/use-curved-track";
import { SOUND_STAGE_EXIT_VH } from "@/hooks/use-landing-sound-stage";

/**
 * 桥段：整块画面是一面内凹的「带鱼屏」。纵向滚动换算成沿弧面的横移，
 * 六个场景从右侧弯进视野、在正中放平，再从左侧弯出去。
 * 副歌钉住时，这一章向上叠进它的退场段，从底部升上来盖住正在后退的上一屏。
 */
export function LandingDay() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const isNear = useInView(sectionRef, { once: true, margin: "100% 0px" });
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });
  const layout = useCurvedTrack(stageRef, scrollYProgress, LANDING_DAY_MOMENTS.length);

  return (
    <section
      ref={sectionRef}
      data-landing-chapter="bridge"
      aria-labelledby="landing-day-title"
      className="landing-pin:-mt-(--chorus-exit) relative"
      style={
        {
          height: layout.travel + layout.viewportHeight,
          "--chorus-exit": `${SOUND_STAGE_EXIT_VH}vh`,
        } as CSSProperties
      }
    >
      <div
        ref={stageRef}
        className="sticky top-0 h-svh overflow-hidden"
        style={{ perspective: `${layout.perspective}px` }}
      >
        <div className="absolute inset-x-[8vw] top-24 h-px bg-white/10">
          <motion.span
            className="absolute inset-0 origin-left bg-linear-to-r from-white/40 to-[#f0b878]"
            style={{ scaleX: scrollYProgress }}
          />
        </div>

        <LandingDayIntro layout={layout} />
        {LANDING_DAY_MOMENTS.map((moment, index) => (
          <LandingDayCard
            key={moment.scene}
            center={layout.cardCenters[index]!}
            index={index}
            layout={layout}
            moment={moment}
            showImage={isNear}
          />
        ))}

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(5,6,11,0.7),transparent_16%,transparent_84%,rgba(5,6,11,0.7))]"
        />
      </div>
    </section>
  );
}
