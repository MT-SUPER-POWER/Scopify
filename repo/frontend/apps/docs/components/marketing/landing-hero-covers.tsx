"use client";

import { type MotionValue, motion } from "framer-motion";

import { LandingAlbumCover } from "@/components/marketing/landing-album-cover";
import { LANDING_COVER_CROPS, LANDING_MAIN_SCREENSHOT } from "@/constants/marketing";
import { useScrollTransform } from "@/hooks/use-scroll-transform";
import { heroAt } from "@/lib/marketing/landing-hero-timeline";
import type { LandingCoverCrop } from "@/types/marketing";

const { height: SCREENSHOT_HEIGHT, width: SCREENSHOT_WIDTH } = LANDING_MAIN_SCREENSHOT.src;
/** 每张封面浮出屏幕的高度（px）：中间高、两侧低，连成一道弧。 */
const COVER_LIFT = [48, 76, 96, 96, 76, 48] as const;
/** 窗口放平后封面开始浮起的位置（前奏吸顶段里的 vh），相邻封面依次错开。 */
const LIFT_START_VH = 84;
const LIFT_STAGGER_VH = 5;
const LIFT_DURATION_VH = 30;
/** 封面淡入只占浮起开始前后这一点距离（vh）。 */
const FADE_VH = 4;

interface LiftedCoverProps {
  crop: LandingCoverCrop;
  index: number;
  progress: MotionValue<number>;
}

function LiftedCover({ crop, index, progress }: LiftedCoverProps) {
  const startVh = LIFT_START_VH + index * LIFT_STAGGER_VH;
  const start = heroAt(startVh);
  const end = heroAt(startVh + LIFT_DURATION_VH);
  const z = useScrollTransform(progress, [start, end], [0, COVER_LIFT[index] ?? 100]);
  const opacity = useScrollTransform(
    progress,
    [heroAt(startVh - FADE_VH), heroAt(startVh + FADE_VH)],
    [0, 1],
  );
  const boxShadow = useScrollTransform(
    progress,
    [start, end],
    ["0px 0px 0px rgba(0,0,0,0)", "0px 36px 60px rgba(0,0,0,0.6)"],
  );

  return (
    <motion.div
      aria-hidden="true"
      className="absolute overflow-hidden rounded-md ring-1 ring-white/15"
      style={{
        boxShadow,
        left: `${(crop.x / SCREENSHOT_WIDTH) * 100}%`,
        opacity,
        top: `${(crop.y / SCREENSHOT_HEIGHT) * 100}%`,
        width: `${(crop.size / SCREENSHOT_WIDTH) * 100}%`,
        z,
      }}
    >
      <LandingAlbumCover crop={crop} className="aspect-square w-full" />
    </motion.div>
  );
}

/**
 * 窗口放平之后，「为你推荐」那一排真实的专辑封面从屏幕里依次浮起来：
 * 不额外画装饰，而是让界面本身的内容走到观众面前。
 */
export function LandingHeroCovers({ progress }: { progress: MotionValue<number> }) {
  return LANDING_COVER_CROPS.map((crop, index) => (
    <LiftedCover key={crop.x} crop={crop} index={index} progress={progress} />
  ));
}
