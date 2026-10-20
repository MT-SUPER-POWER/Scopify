"use client";

import { type MotionValue, motion, useTransform } from "framer-motion";
import { type KeyboardEvent, type PointerEvent, useRef } from "react";

import { LANDING_VISUALIZER_MODES } from "@/constants/marketing";

/** 齿轮半径（px）：圆心在屏幕右侧之外，只露出左边一段弧。 */
const DIAL_RADIUS = 380;
/** 相邻两种动画在齿轮上相隔的角度。 */
const STEP_DEG = 8.5;
/** 齿的间隔角度，绕满一圈。 */
const TOOTH_STEP_DEG = 1.7;
/** 齿轮最左侧离容器左边的距离（px），给固定的指示留位置。 */
const RIM_INSET = 24;
/** 拖动多远（px）算转过一档：正好是相邻两档之间的弧长。 */
const DRAG_PX_PER_MODE = (DIAL_RADIUS * STEP_DEG * Math.PI) / 180;
/** 按下后移动超过这么多（px）才算拖动，否则当作点击。 */
const DRAG_THRESHOLD = 4;

const MODE_COUNT = LANDING_VISUALIZER_MODES.length;
const TEETH = Array.from({ length: Math.round(360 / TOOTH_STEP_DEG) }, (_, index) => {
  const angle = index * TOOTH_STEP_DEG;
  return { angle, isMajor: index % Math.round(STEP_DEG / TOOTH_STEP_DEG) === 0 };
});

/**
 * 从圆心出发、转过 `angle` 度后再往左推 `distance`：0° 是齿轮最左侧（9 点钟方向），
 * 正角度往上、负角度往下；元素自身也跟着转，文字因此像辐条一样指向圆心。
 */
const spoke = (angle: number, distance: number) => `rotate(${angle}deg) translateX(${-distance}px)`;

interface LandingModeDialProps {
  modeIndex: number;
  /** 节目单上的连续位置（不带阻尼），拖动从这里起算。 */
  modePosition: MotionValue<number>;
  onPick: (index: number) => void;
  /** 拖动中：把页面滚到某个连续位置。 */
  onScrub: (position: number) => void;
  /** 松手：吸到最近的一档。 */
  onSettle: () => void;
  /** 滚轮的转动位置（带档位阻尼），整数即对准某一档。 */
  position: MotionValue<number>;
}

/**
 * 立在舞台右侧边缘的一只大齿轮：14 种歌词动画像辐条一样刻在轮缘内侧，外缘一圈齿。
 * 往下滚它就顺时针转，转到左侧固定的绿色指示前的那一档就是正在演的动画；
 * 可以用鼠标上下拖着转（触屏直接滑动页面即可），松手吸到最近一档，也可以点任意一档跳过去。
 */
export function LandingModeDial({
  modeIndex,
  modePosition,
  onPick,
  onScrub,
  onSettle,
  position,
}: LandingModeDialProps) {
  const rotate = useTransform(position, (value) => value * STEP_DEG);
  const dragRef = useRef<{ dragging: boolean; from: number; startY: number } | null>(null);

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    // 触屏上下滑本来就会滚动页面、带着齿轮一起转，只有鼠标与触控笔需要自己处理拖动。
    if (event.pointerType === "touch" || event.button !== 0) return;
    dragRef.current = { dragging: false, from: modePosition.get(), startY: event.clientY };
  };
  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    const deltaY = event.clientY - drag.startY;
    if (!drag.dragging) {
      if (Math.abs(deltaY) < DRAG_THRESHOLD) return;
      // 真正开始拖动才捕获指针，单纯的点击仍然落在档位按钮上。
      drag.dragging = true;
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    // 往上拖，轮缘跟着往上走，后面的档位转上来。
    onScrub(drag.from - deltaY / DRAG_PX_PER_MODE);
  };
  const handlePointerEnd = () => {
    if (dragRef.current?.dragging) onSettle();
    dragRef.current = null;
  };
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[event.key];
    if (!step) return;
    event.preventDefault();
    onPick(Math.min(MODE_COUNT - 1, Math.max(0, modeIndex + step)));
  };

  return (
    <div
      role="group"
      aria-label="歌词动画节目单"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      onKeyDown={handleKeyDown}
      className="relative h-[70svh] w-36 cursor-grab overflow-hidden [mask-image:linear-gradient(180deg,transparent,#000_22%,#000_78%,transparent)] select-none active:cursor-grabbing"
    >
      {/* 从屏幕边缘压一层暗，凝彩这类会把整块舞台铺成浅色纸面的动画上也看得清刻度。 */}
      <span
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(270deg,rgba(5,6,11,0.7),rgba(5,6,11,0.35)_60%,transparent)]"
      />
      <motion.div
        className="absolute top-1/2 size-0"
        style={{ left: RIM_INSET + DIAL_RADIUS, rotate }}
      >
        <span
          aria-hidden="true"
          className="absolute rounded-full border border-white/12"
          style={{
            height: DIAL_RADIUS * 2,
            left: -DIAL_RADIUS,
            top: -DIAL_RADIUS,
            width: DIAL_RADIUS * 2,
          }}
        />
        {TEETH.map(({ angle, isMajor }) => (
          <span
            key={angle}
            aria-hidden="true"
            className={`absolute top-0 left-0 h-px origin-left ${
              isMajor ? "w-2.5 bg-white/45" : "w-1.5 bg-white/20"
            }`}
            style={{ transform: spoke(angle, DIAL_RADIUS + (isMajor ? 10 : 6)) }}
          />
        ))}
        {LANDING_VISUALIZER_MODES.map((item, index) => {
          const isCurrent = index === modeIndex;
          const number = String(index + 1).padStart(2, "0");
          return (
            <span
              key={item.value}
              className="absolute top-0 left-0 size-0"
              style={{ transform: spoke(-index * STEP_DEG, DIAL_RADIUS - 10) }}
            >
              <button
                type="button"
                aria-label={`${number} ${item.label}`}
                aria-current={isCurrent ? "true" : undefined}
                onClick={() => onPick(index)}
                className="group absolute top-0 left-0 flex -translate-y-1/2 cursor-pointer items-center gap-2 rounded-sm py-1 pr-1 whitespace-nowrap focus-visible:outline-1 focus-visible:outline-white/60"
              >
                <span
                  className={`h-px w-2 transition-colors duration-300 ${
                    isCurrent ? "bg-[#1ed760]" : "bg-white/40"
                  }`}
                />
                <span
                  className={`font-mono text-[0.6rem] leading-none tabular-nums transition-colors duration-300 ${
                    isCurrent ? "text-white" : "text-white/40 group-hover:text-white/75"
                  }`}
                >
                  {number}
                </span>
                <span
                  className={`leading-none transition-all duration-300 ${
                    isCurrent
                      ? "text-sm font-semibold text-white"
                      : "text-[0.72rem] text-white/45 group-hover:text-white/80"
                  }`}
                >
                  {item.label}
                </span>
              </button>
            </span>
          );
        })}
      </motion.div>

      {/* 固定的指示，不随齿轮转动，对准 9 点钟方向那一档。 */}
      <span
        aria-hidden="true"
        className="absolute top-1/2 -mt-[5px] border-y-[5px] border-l-[6px] border-y-transparent border-l-[#1ed760] drop-shadow-[0_0_6px_rgba(30,215,96,0.6)]"
        style={{ left: RIM_INSET - 18 }}
      />
    </div>
  );
}
