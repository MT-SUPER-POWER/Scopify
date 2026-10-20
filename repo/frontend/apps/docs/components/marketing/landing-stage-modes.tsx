"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { LANDING_FEATURES_DOC_URL, LANDING_VISUALIZER_MODES } from "@/constants/marketing";

const EASE = [0.22, 1, 0.36, 1] as const;

interface LandingStageModesProps {
  modeIndex: number;
  onPick: (index: number) => void;
}

/**
 * 舞台右下角的「正在演」：序号、动画名和一条 14 格的节目进度，随滚动逐格点亮。
 * 放在右下角，是因为莫奈等动画会自己占用左侧整列与左下角，右侧中部还有它的画框。
 */
export function LandingStageModes({ modeIndex, onPick }: LandingStageModesProps) {
  const current = LANDING_VISUALIZER_MODES[modeIndex]!;

  return (
    <div className="pointer-events-none absolute inset-0 z-30">
      <div className="pointer-events-auto absolute right-5 bottom-28 flex w-56 flex-col items-end text-right sm:right-8 lg:right-12 xl:bottom-8">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={current.value}
            initial={{ opacity: 0, y: 12, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -10, filter: "blur(8px)" }}
            transition={{ duration: 0.45, ease: EASE }}
          >
            <p className="font-mono text-[0.65rem] tracking-[0.22em] text-white/50 uppercase">
              {String(modeIndex + 1).padStart(2, "0")} / {LANDING_VISUALIZER_MODES.length} ·{" "}
              {current.value}
            </p>
            <p className="landing-display mt-1 text-[clamp(2.2rem,3.6vw,3.2rem)] leading-none font-semibold tracking-[-0.03em] text-white">
              {current.label}
            </p>
          </motion.div>
        </AnimatePresence>

        <div role="group" aria-label="歌词动画节目单" className="mt-4 flex w-full gap-1">
          {LANDING_VISUALIZER_MODES.map((item, index) => {
            const isCurrent = index === modeIndex;
            const isPlayed = index < modeIndex;
            return (
              <button
                key={item.value}
                type="button"
                title={item.label}
                aria-label={item.label}
                aria-current={isCurrent ? "true" : undefined}
                onClick={() => onPick(index)}
                className="group flex-1 py-2"
              >
                <span
                  className={`block h-[3px] rounded-full transition-colors duration-500 ${
                    isCurrent
                      ? "bg-white shadow-[0_0_10px_rgba(255,255,255,0.7)]"
                      : isPlayed
                        ? "bg-white/55 group-hover:bg-white/80"
                        : "bg-white/15 group-hover:bg-white/45"
                  }`}
                />
              </button>
            );
          })}
        </div>

        <Link
          href={`${LANDING_FEATURES_DOC_URL}#歌词与-folia`}
          className="group mt-2 inline-flex items-center gap-1.5 text-xs text-white/45 transition-colors hover:text-white"
        >
          实时渲染 · 与客户端同一套 Folia 代码
          <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </div>
  );
}
