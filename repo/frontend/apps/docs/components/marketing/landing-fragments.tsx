"use client";

import type { RefObject } from "react";
import { motion } from "framer-motion";

interface LandingFragmentsProps {
  active: boolean;
  sectionRef: RefObject<HTMLElement | null>;
}

const panelClass = "border-x border-white/10 bg-[#05070e]/94";
const wordClass =
  "landing-display absolute bottom-[7svh] left-1/2 -translate-x-1/2 text-[clamp(3.4rem,7vw,8rem)] font-light text-white/84";

export function LandingFragments({ active, sectionRef }: LandingFragmentsProps) {
  return (
    <section
      ref={sectionRef}
      aria-label="Folia 歌词切片"
      className="relative min-h-svh overflow-hidden"
    >
      <div className="absolute inset-x-0 top-0 h-[10svh] bg-[#05070e]/94" />
      <div className="absolute inset-x-0 bottom-0 h-[10svh] bg-[#05070e]/94" />

      <div className="absolute inset-x-0 top-[10svh] bottom-[10svh] grid grid-cols-[0.8fr_0.55fr_0.7fr_0.55fr_0.8fr] sm:grid-cols-[1.3fr_0.55fr_0.7fr_0.8fr_0.7fr_0.55fr_1.3fr]">
        <div className={panelClass} />
        <div className="relative overflow-hidden border-y border-white/10">
          <motion.span
            className={wordClass}
            initial={false}
            animate={{ opacity: active ? 1 : 0, y: active ? 0 : 52 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          >
            停
          </motion.span>
        </div>
        <div className={panelClass} />
        <div className="relative overflow-hidden border-y border-white/10">
          <motion.span
            className={wordClass}
            initial={false}
            animate={{ opacity: active ? 1 : 0, y: active ? -10 : 64 }}
            transition={{ duration: 1, delay: active ? 0.12 : 0, ease: [0.22, 1, 0.36, 1] }}
          >
            转
          </motion.span>
        </div>
        <div className={panelClass} />
        <div className="relative hidden overflow-hidden border-y border-white/10 sm:block">
          <motion.span
            className={wordClass}
            initial={false}
            animate={{ opacity: active ? 1 : 0, y: active ? -22 : 70 }}
            transition={{ duration: 1, delay: active ? 0.24 : 0, ease: [0.22, 1, 0.36, 1] }}
          >
            现
          </motion.span>
        </div>
        <div className={`${panelClass} hidden sm:block`} />
      </div>

      <motion.p
        className="landing-display absolute top-[7svh] left-[6vw] z-10 text-sm tracking-[0.16em] text-white/52 sm:text-base"
        initial={false}
        animate={{ opacity: active ? 1 : 0 }}
        transition={{ duration: 0.9, delay: active ? 0.2 : 0 }}
      >
        字，也有换气的时候。
      </motion.p>
    </section>
  );
}
