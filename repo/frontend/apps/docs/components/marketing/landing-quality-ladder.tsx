"use client";

import { motion, useMotionValueEvent, useScroll } from "framer-motion";
import { useRef, useState } from "react";

import { LANDING_QUALITY_TIERS } from "@/constants/marketing";

const TOP_TIER = LANDING_QUALITY_TIERS.length - 1;

/** 九档音质自下而上排列，往下滚动时光标一路爬到「超清母带」。 */
export function LandingQualityLadder() {
  const ladderRef = useRef<HTMLDivElement>(null);
  const [level, setLevel] = useState(0);
  const { scrollYProgress } = useScroll({ target: ladderRef, offset: ["start 85%", "end 45%"] });
  useMotionValueEvent(scrollYProgress, "change", (value) => setLevel(Math.round(value * TOP_TIER)));

  return (
    <div ref={ladderRef} className="relative pl-7">
      <span className="absolute inset-y-2 left-0 w-px bg-white/10" />
      <motion.span
        aria-hidden="true"
        className="absolute inset-y-2 left-0 w-px origin-bottom bg-linear-to-t from-white/30 via-[#1ed760]/80 to-[#e8c77a]"
        style={{ scaleY: scrollYProgress }}
      />
      <ol aria-label="音质档位，从低到高" className="flex flex-col-reverse">
        {LANDING_QUALITY_TIERS.map((tier, index) => {
          const isActive = index === level;
          const isLit = index <= level;
          const isMaster = index === TOP_TIER;
          return (
            <li
              key={tier.label}
              className="relative flex items-baseline gap-4 border-b border-white/6 py-2.5 first:border-b-0"
            >
              <span
                className={`absolute top-1/2 -left-7 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full transition-all duration-500 ${
                  isActive
                    ? `scale-150 ${
                        isMaster
                          ? "bg-[#e8c77a] shadow-[0_0_14px_#e8c77a]"
                          : "bg-[#1ed760] shadow-[0_0_14px_#1ed760]"
                      }`
                    : isLit
                      ? "bg-white/50"
                      : "bg-white/12"
                }`}
              />
              <span className="w-5 font-mono text-[0.62rem] text-white/30 tabular-nums">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span
                className={`landing-display flex-1 transition-all duration-500 ${
                  isActive
                    ? `text-2xl font-semibold ${isMaster ? "text-[#f1d896]" : "text-white"}`
                    : `text-base ${isLit ? "text-white/65" : "text-white/25"}`
                }`}
              >
                {tier.label}
              </span>
              <span
                className={`font-mono text-[0.65rem] transition-colors duration-500 ${
                  isActive ? "text-white/70" : "text-white/25"
                }`}
              >
                {tier.spec}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
