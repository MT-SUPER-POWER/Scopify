"use client";

import type { RefObject } from "react";
import { motion } from "framer-motion";

interface LandingPerformanceProps {
  active: boolean;
  sectionRef: RefObject<HTMLElement | null>;
}

export function LandingPerformance({ active, sectionRef }: LandingPerformanceProps) {
  return (
    <section ref={sectionRef} aria-label="Folia 动态歌词演出" className="relative min-h-svh">
      <motion.div
        className="absolute inset-x-[6vw] top-[7svh] flex items-center justify-between text-[0.62rem] font-medium tracking-[0.26em] text-white/38 uppercase"
        initial={false}
        animate={{ opacity: active ? 1 : 0 }}
        transition={{ duration: 0.8 }}
      >
        <span>Folia</span>
        <span>Sonnet / 01</span>
      </motion.div>
    </section>
  );
}
