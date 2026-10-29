"use client";

import { type MotionValue, motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

import { LANDING_CREDITS, LANDING_CREDITS_THANKS } from "@/constants/marketing";

/** 片尾字幕这一段的高度（vh）：吸顶一屏，其余都是字幕滚过去的距离。 */
const CREDITS_SECTION_VH = 300;
/** 折线的位置（屏幕高度的百分比）：上面是向远处退去的地面，下面是正对着人的墙面。 */
const FOLD_SVH = 68;
/** 折线以下那截墙面的高度（svh）。 */
const WALL_SVH = 100 - FOLD_SVH;
/** 地面有多长（svh）、往后倒下多少度：接近 90° 才是平躺的地面，小了会变成往上翘的斜坡。 */
const FLOOR_SVH = 260;
const FLOOR_TILT_DEG = 88;
/**
 * 透视距离与视点：视点（地平线）在屏幕上沿之外，折线附近的压扁程度约为
 * 「折线到地平线的距离 ÷ 透视距离」，所以透视距离要比折线到地平线远，地面才显得平躺着。
 */
const PERSPECTIVE = "70rem";
const PERSPECTIVE_ORIGIN = "50% -10%";
/** 最后一行「感谢收听」在墙面上停住时，名单底边离折线多远（svh）。 */
const THANKS_REST_SVH = 24;
/** 滚动行程里，前多少用来滚字幕；之后「感谢收听」停住，最后一小段整块淡出，交给结尾。 */
const ROLL_END = 0.82;
const FADE_START = 0.9;
/** 网格一格的边长（px），地面和墙面共用，折线两侧的线因此对得上。 */
const GRID_PX = 96;
/** 字幕滚完全程时网格跟着走多远（px）。 */
const GRID_TRAVEL_PX = GRID_PX * 12;

const GRID_LINES =
  "linear-gradient(rgba(255,255,255,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.18) 1px, transparent 1px)";

/**
 * 尾声开头的片尾字幕，做成一张从墙面翻折到地面上的纸：下面一截是正对着人的墙面，
 * 名单从屏幕下沿升上来、平平地走到折线，在那里翻折到地面上，往地平线退去。
 * 同一份名单在墙面和地面上各放一份、用同一个位移，两份在折线处正好接上；网格也一样。
 * 最后一行「感谢收听」停在墙面上，整块淡出后才是结尾的标题与按钮。
 * 减少动态效果时直接平铺成一张名单。
 */
export function LandingCredits() {
  const ref = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion() ?? false;
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const roll = useTransform(scrollYProgress, (progress) => Math.min(1, progress / ROLL_END));
  // 位移以折线为原点：名单顶边从墙面底边之外出发，滚到名单底边停在折线下方 THANKS_REST_SVH 处。
  const rollTransform = useTransform(
    roll,
    (value) =>
      `translateY(calc(${(1 - value) * WALL_SVH + value * THANKS_REST_SVH}svh - ${value * 100}%))`,
  );
  const gridShift = useTransform(roll, (value) => value * GRID_TRAVEL_PX);
  // 两块网格都以折线为原点：墙面从顶边往下数，地面从底边往上数，同一根线在折线两侧接上。
  const wallGrid = useTransform(gridShift, (shift) => `50% ${-shift}px`);
  const floorGrid = useTransform(gridShift, (shift) => `50% calc(100% - ${shift}px)`);
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
        style={{
          opacity: layerOpacity,
          perspective: PERSPECTIVE,
          perspectiveOrigin: PERSPECTIVE_ORIGIN,
        }}
      >
        {/* 地面：底边就是折线，绕底边往后倒下；比屏幕宽一倍，倒下后两侧不露边。 */}
        <div
          aria-hidden="true"
          className="absolute inset-x-[-50%] origin-bottom overflow-hidden"
          style={{
            bottom: `${WALL_SVH}svh`,
            height: `${FLOOR_SVH}svh`,
            transform: `rotateX(${FLOOR_TILT_DEG}deg)`,
          }}
        >
          <div className="absolute inset-0 [mask-image:linear-gradient(to_top,black_20%,transparent_85%)]">
            <motion.div
              className="absolute inset-0"
              style={{
                backgroundImage: GRID_LINES,
                backgroundPosition: floorGrid,
                backgroundSize: `${GRID_PX}px ${GRID_PX}px`,
              }}
            />
            <CreditRoll className="top-full left-1/4 w-1/2" transform={rollTransform} />
          </div>
        </div>

        {/* 墙面：折线以下正对着人，名单在这里是平的。 */}
        <div
          className="absolute inset-x-0 bottom-0 overflow-hidden"
          style={{ top: `${FOLD_SVH}svh` }}
        >
          <motion.div
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              backgroundImage: GRID_LINES,
              backgroundPosition: wallGrid,
              backgroundSize: `${GRID_PX}px ${GRID_PX}px`,
            }}
          />
          <CreditRoll className="top-0 left-0 w-full" transform={rollTransform} />
        </div>

        <div
          aria-hidden="true"
          className="absolute inset-x-0 h-px bg-white/25"
          style={{ top: `${FOLD_SVH}svh` }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-[30svh] bg-linear-to-b from-[#05060b] via-[#05060b]/70 to-transparent"
        />
      </motion.div>
    </div>
  );
}

/** 一份滚动中的名单；地面和墙面各放一份，宽度都等于屏幕宽，位移相同。 */
function CreditRoll({
  className,
  transform,
}: {
  className: string;
  transform: MotionValue<string>;
}) {
  return (
    <motion.div
      className={`absolute flex flex-col items-center gap-[9svh] px-[12vw] text-center ${className}`}
      style={{ transform }}
    >
      <CreditList />
    </motion.div>
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
