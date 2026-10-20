"use client";

import { type MotionValue, motion, useTransform } from "framer-motion";

import { LANDING_VISUALIZER_MODES } from "@/constants/marketing";

/** 相邻两种动画在对焦环上相隔的角度。 */
const STEP_DEG = 20;
/** 每两档之间的细刻度条数。 */
const MINOR_PER_STEP = 3;
/** 防滑纹的间隔角度，绕满一圈。 */
const GRIP_STEP_DEG = 5;
/** 对焦环半径（px），约等于环可视高度（20rem）的一半。 */
const RING_RADIUS = 156;

/** 把一个刻度贴到圆柱表面的某个角度上：角度越大越靠下。 */
const onRing = (angle: number) => `rotateX(${-angle}deg) translateZ(${RING_RADIUS}px)`;

const MINOR_ANGLES = LANDING_VISUALIZER_MODES.slice(1).flatMap((_, gap) =>
  Array.from(
    { length: MINOR_PER_STEP },
    (_, tick) => (gap + (tick + 1) / (MINOR_PER_STEP + 1)) * STEP_DEG,
  ),
);
const GRIP_ANGLES = Array.from(
  { length: 360 / GRIP_STEP_DEG },
  (_, index) => index * GRIP_STEP_DEG,
);

interface LandingFocusRingProps {
  modeIndex: number;
  onPick: (index: number) => void;
  /** 节目单上的连续位置，整数即对准某一档。 */
  position: MotionValue<number>;
}

/**
 * 竖着立在舞台最右侧的镜头对焦环：14 种歌词动画像距离刻度一样刻在圆柱上，
 * 往下滚环就往上转，转到左侧固定的绿色指示旁的那一档就是正在演的动画；
 * 环的右侧是一圈防滑纹。点任意一档会滚到该动画登场的位置。
 */
export function LandingFocusRing({ modeIndex, onPick, position }: LandingFocusRingProps) {
  const rotateX = useTransform(position, (value) => value * STEP_DEG);

  return (
    <div role="group" aria-label="歌词动画节目单" className="relative h-80 w-[5.25rem]">
      {/* 上下渐隐，像刻度转进了镜筒的阴影里。 */}
      <div className="absolute inset-0 [mask-image:linear-gradient(180deg,transparent,#000_26%,#000_74%,transparent)] perspective-[680px]">
        <div
          aria-hidden="true"
          className="absolute inset-0 border-x border-white/10 bg-[linear-gradient(180deg,transparent,rgba(5,6,11,0.6)_50%,transparent)]"
        >
          <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent,rgba(255,255,255,0.07)_50%,transparent)]" />
        </div>
        <motion.div
          className="absolute inset-x-0 top-1/2 h-0 transform-3d"
          style={{ z: -RING_RADIUS, rotateX }}
        >
          {MINOR_ANGLES.map((angle) => (
            <span
              key={angle}
              aria-hidden="true"
              className="absolute left-0 h-px w-1.5 bg-white/30 backface-hidden"
              style={{ transform: onRing(angle) }}
            />
          ))}
          {GRIP_ANGLES.map((angle) => (
            <span
              key={angle}
              aria-hidden="true"
              className="absolute -top-px right-1 h-0.5 w-3 rounded-full bg-white/15 backface-hidden"
              style={{ transform: onRing(angle) }}
            />
          ))}
          {LANDING_VISUALIZER_MODES.map((item, index) => {
            const isCurrent = index === modeIndex;
            const number = String(index + 1).padStart(2, "0");
            return (
              <button
                key={item.value}
                type="button"
                aria-label={`${number} ${item.label}`}
                aria-current={isCurrent ? "true" : undefined}
                onClick={() => onPick(index)}
                className="group absolute -top-2.5 left-0 flex h-5 items-center gap-1.5 rounded-sm pr-1 backface-hidden focus-visible:outline-1 focus-visible:outline-white/60"
                style={{ transform: onRing(index * STEP_DEG) }}
              >
                <span
                  className={`h-px w-2.5 transition-colors duration-300 ${
                    isCurrent ? "bg-[#1ed760]" : "bg-white/60"
                  }`}
                />
                <span
                  className={`font-mono text-[0.6rem] leading-none tabular-nums transition-colors duration-300 ${
                    isCurrent ? "text-white" : "text-white/45 group-hover:text-white/80"
                  }`}
                >
                  {number}
                </span>
                <span
                  className={`text-[0.72rem] leading-none whitespace-nowrap transition-colors duration-300 ${
                    isCurrent ? "text-white" : "text-white/40 group-hover:text-white/75"
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </motion.div>
      </div>

      {/* 固定在镜筒上的对焦指示，不随环转动。 */}
      <span
        aria-hidden="true"
        className="absolute top-1/2 -left-2.5 -mt-[5px] border-y-[5px] border-l-[6px] border-y-transparent border-l-[#1ed760] drop-shadow-[0_0_6px_rgba(30,215,96,0.6)]"
      />
    </div>
  );
}
