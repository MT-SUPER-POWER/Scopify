// Adapted from chthollyphile/folia-major v0.8.0 (3b91924f1), AGPL-3.0.
import { useRef } from "react";
import type { ScratchpadSection as ScratchpadTab } from "@/types/scratchpad/components";
import type { PaperFrame, PaperMotion, PaperMotionOptions } from "@/types/scratchpad/folia";
import { PAPER_EASE } from "@/lib/scratchpad/scratchpadPaper";
const WRAP_DURATION = 0.58;
const WRAP_LEAVE = 0.5;
const WRAP_RISE_EASE = [0.2, 0.8, 0.3, 1] as const;

export const usePaperMotions = <Mode extends string>(slimMode: Mode) => {
  const motionsRef = useRef<
    Partial<Record<ScratchpadTab, PaperMotion & { mode: Mode; frame: PaperFrame }>>
  >({});
  return (
    id: ScratchpadTab,
    mode: Mode,
    frame: PaperFrame,
    { calm, above, below, settle }: PaperMotionOptions,
  ): PaperMotion => {
    const key = `${mode}|${frame.top}|${frame.left}|${frame.width}|${frame.height}|${calm ? 1 : 0}`;
    const previous = motionsRef.current[id];
    if (previous?.key === key) return previous;
    const toBottom =
      !calm && previous !== undefined && previous.mode !== slimMode && mode === slimMode;
    const next: PaperMotion = toBottom
      ? {
          key,
          // null：从此刻的位置（可能还在半路）起；离开视口、在视口外跳到下面、升到细纸带的位置。
          // 高、宽、左边也在视口外的那一下对齐。
          animate: {
            top: [null, above - previous.frame.height, below, frame.top],
            height: [previous.frame.height, previous.frame.height, frame.height, frame.height],
            left: [previous.frame.left, previous.frame.left, frame.left, frame.left],
            width: [previous.frame.width, previous.frame.width, frame.width, frame.width],
            ...Object.fromEntries(
              Object.entries(settle ?? {}).map(([name, value]) => [
                name,
                [value, value, value, value],
              ]),
            ),
          },
          transition: {
            duration: WRAP_DURATION,
            times: [0, WRAP_LEAVE, WRAP_LEAVE + 0.0005, 1],
            ease: ["easeIn", "linear", WRAP_RISE_EASE],
          },
          // 样子在视口外换：离开途中仍是原来的样子，回来时已经是细纸带。
          faceIn: { duration: 0.01, delay: WRAP_DURATION * WRAP_LEAVE },
          faceOut: { duration: 0.01, delay: WRAP_DURATION * WRAP_LEAVE },
        }
      : {
          key,
          animate: { ...frame, ...settle },
          transition: calm ? { duration: 0 } : { duration: 0.52, ease: PAPER_EASE },
          faceIn: { duration: calm ? 0.12 : 0.22, delay: calm ? 0 : 0.14 },
          faceOut: { duration: calm ? 0.08 : 0.14 },
        };
    motionsRef.current[id] = { ...next, mode, frame };
    return next;
  };
};
