"use client";

import { AnimatePresence, motion, useInView, useReducedMotion } from "framer-motion";
import { Clock } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import { LandingSectionHeading } from "@/components/marketing/landing-section-heading";
import { LANDING_DAY_MOMENTS } from "@/constants/marketing";

const AUTOPLAY_INTERVAL_MS = 6000;
const EASE = [0.22, 1, 0.36, 1] as const;

export function LandingDay() {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { amount: 0.4 });
  const prefersReducedMotion = useReducedMotion() ?? false;
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAutoplay, setIsAutoplay] = useState(true);
  const shouldAutoplay = isAutoplay && isInView && !prefersReducedMotion;
  const moment = LANDING_DAY_MOMENTS[activeIndex]!;

  useEffect(() => {
    if (!shouldAutoplay) return;
    const timer = window.setTimeout(() => {
      setActiveIndex((index) => (index + 1) % LANDING_DAY_MOMENTS.length);
    }, AUTOPLAY_INTERVAL_MS);
    return () => window.clearTimeout(timer);
  }, [activeIndex, shouldAutoplay]);

  const selectMoment = (index: number) => {
    setIsAutoplay(false);
    setActiveIndex(index);
  };

  return (
    <section
      ref={sectionRef}
      aria-labelledby="landing-day-title"
      className="mx-auto w-full max-w-360 px-5 sm:px-8 lg:px-12"
    >
      <div className="border-t border-white/12 pt-12 sm:pt-16">
        <LandingSectionHeading
          id="landing-day-title"
          title="一天里，它陪你的六个时刻"
          subtitle="清晨要一首歌开场，深夜要一点安静。不同的时刻，你需要的是不同的 Scopify。"
          icon={<Clock className="size-4 text-[#1ed760]" strokeWidth={1.8} />}
          meta="从 07:30 到 01:00"
        />

        <div
          role="tablist"
          aria-label="一天中的时刻"
          className="mt-10 grid grid-cols-3 border-t border-white/10 sm:grid-cols-6"
        >
          {LANDING_DAY_MOMENTS.map((item, index) => {
            const isActive = index === activeIndex;
            return (
              <button
                key={item.clock}
                type="button"
                role="tab"
                id={`landing-day-tab-${index}`}
                aria-controls="landing-day-panel"
                aria-selected={isActive}
                onClick={() => selectMoment(index)}
                className="group relative py-4 text-left"
              >
                <span className="absolute inset-x-0 top-0 h-px overflow-hidden">
                  {isActive ? (
                    <motion.span
                      key={`${activeIndex}-${shouldAutoplay}`}
                      className="block h-full bg-[#1ed760]"
                      initial={{ width: shouldAutoplay ? "0%" : "100%" }}
                      animate={{ width: "100%" }}
                      transition={{
                        duration: shouldAutoplay ? AUTOPLAY_INTERVAL_MS / 1000 : 0,
                        ease: "linear",
                      }}
                    />
                  ) : null}
                </span>
                <span
                  className={`block font-mono text-[0.68rem] tracking-[0.14em] transition-colors ${
                    isActive ? "text-[#1ed760]" : "text-white/30 group-hover:text-white/55"
                  }`}
                >
                  {item.clock}
                </span>
                <span
                  className={`mt-1 block text-base font-bold transition-colors sm:text-lg ${
                    isActive ? "text-white" : "text-white/40 group-hover:text-white/70"
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>

        <div
          id="landing-day-panel"
          role="tabpanel"
          aria-labelledby={`landing-day-tab-${activeIndex}`}
          className="mt-8 grid items-center gap-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-14"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={moment.clock}
              initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={prefersReducedMotion ? undefined : { opacity: 0, y: -12 }}
              transition={{ duration: 0.45, ease: EASE }}
            >
              <span className="inline-flex items-center gap-2 rounded-full border border-white/12 px-3 py-1 text-xs font-medium text-white/60">
                <span className="size-1.5 rounded-full bg-[#1ed760]" />
                {moment.feature}
              </span>
              <p className="landing-display mt-5 text-[clamp(1.5rem,2.6vw,2.4rem)] leading-[1.4] font-medium tracking-[-0.02em] text-balance text-white">
                {moment.sentence}
              </p>
            </motion.div>
          </AnimatePresence>

          <div className="relative aspect-video overflow-hidden rounded-xl border border-white/10 bg-white/4 shadow-[0_30px_100px_rgba(0,0,0,0.45)]">
            <AnimatePresence initial={false}>
              <motion.div
                key={moment.clock}
                className="absolute inset-0"
                initial={prefersReducedMotion ? false : { opacity: 0, scale: 1.02 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6, ease: EASE }}
              >
                <Image
                  src={moment.screenshot.src}
                  alt={moment.screenshot.alt}
                  fill
                  sizes="(min-width: 1024px) 52vw, 92vw"
                  className="object-cover"
                />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
