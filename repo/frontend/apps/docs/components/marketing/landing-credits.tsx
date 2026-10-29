"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

import { LANDING_CREDITS, LANDING_CREDITS_THANKS } from "@/constants/marketing";

/** 片尾字幕这一段的高度（vh）：吸顶一屏，其余都是字幕滚过去的距离。 */
const CREDITS_SECTION_VH = 280;
/** 字幕铺在多长的一块地面上（svh）：越长，同屏能看到的行越多、远处的字越小。 */
const FLOOR_SVH = 240;
/** 最后一行「感谢收听」停在离地面近端多远的地方（svh），在那儿停住，而不是一路滚出地平线。 */
const THANKS_REST_SVH = 62;
/** 滚动行程里，前多少用来滚字幕；之后「感谢收听」停住，最后一小段整块淡出，交给结尾。 */
const ROLL_END = 0.8;
const FADE_START = 0.9;

/**
 * 尾声开头的片尾字幕：演职员表躺在一块向远处退去的透视网格地面上，
 * 往下滚就一行行往地平线滚走，最后一行「感谢收听」停在近处，整块淡出后才是结尾的标题与按钮。
 * 减少动态效果时直接平铺成一张名单。
 */
export function LandingCredits() {
  const ref = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion() ?? false;
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  // 名单从地面最近处（屏幕下沿之外）出发，往地平线滚，直到最后一行「感谢收听」停在近处。
  const rollTransform = useTransform(scrollYProgress, (progress) => {
    const roll = Math.min(1, progress / ROLL_END);
    return `translateY(calc(${-roll * 100}% - ${roll * THANKS_REST_SVH}svh))`;
  });
  const gridShift = useTransform(
    scrollYProgress,
    (progress) => `0 ${Math.min(1, progress / ROLL_END) * 960}px`,
  );
  const layerOpacity = useTransform(scrollYProgress, [FADE_START, 1], [1, 0]);

  if (prefersReducedMotion) {
    return (
      <div
        ref={ref}
        className="mx-auto flex max-w-2xl flex-col items-center gap-10 px-5 py-32 text-center"
      >
        <CreditList />
      </div>
    );
  }

  return (
    <div ref={ref} className="relative" style={{ height: `${CREDITS_SECTION_VH}vh` }}>
      <motion.div
        className="sticky top-0 h-svh overflow-hidden"
        style={{ opacity: layerOpacity, perspective: "36rem", perspectiveOrigin: "50% 20%" }}
      >
        <div
          className="absolute inset-x-[-40%] bottom-0 origin-bottom"
          style={{ height: `${FLOOR_SVH}svh`, transform: "rotateX(62deg)" }}
        >
          <motion.div
            aria-hidden="true"
            className="absolute inset-0 [mask-image:linear-gradient(to_top,black_10%,transparent_70%)]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.14) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.14) 1px, transparent 1px)",
              backgroundPosition: gridShift,
              backgroundSize: "6rem 6rem",
            }}
          />
          <div className="absolute inset-0 [mask-image:linear-gradient(to_top,black_45%,transparent_92%)]">
            <motion.div
              className="absolute inset-x-0 top-full flex flex-col items-center gap-[9svh] px-[30%] text-center"
              style={{ transform: rollTransform }}
            >
              <CreditList />
            </motion.div>
          </div>
        </div>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-[38svh] bg-linear-to-b from-[#05060b] via-[#05060b]/70 to-transparent"
        />
      </motion.div>
    </div>
  );
}

function CreditList() {
  return (
    <>
      {LANDING_CREDITS.map((credit) => (
        <div key={credit.role} className="flex flex-col items-center gap-3">
          <span className="font-mono text-sm tracking-[0.4em] text-white/50 uppercase">
            {credit.role}
          </span>
          <span className="landing-display text-[clamp(2.2rem,5.6vw,5rem)] leading-[1.1] font-semibold tracking-[-0.03em] text-balance text-white">
            {credit.name}
          </span>
        </div>
      ))}
      <span className="landing-display mt-[6svh] text-[clamp(3rem,9vw,8rem)] leading-none font-semibold tracking-[-0.05em] text-[#1ed760]">
        {LANDING_CREDITS_THANKS}
      </span>
    </>
  );
}
