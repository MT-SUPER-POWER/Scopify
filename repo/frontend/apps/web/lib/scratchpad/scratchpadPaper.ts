// Adapted from chthollyphile/folia-major v0.8.0 (3b91924f1), AGPL-3.0.
import type { PaperFrame, PaperMotion } from "@/types/scratchpad/folia";
/** 挪动、长高的曲线（与抽屉滑出同一条）。 */
export const PAPER_EASE = [0.22, 1, 0.36, 1] as const;

/**
 * 绕一圈去底部：一共多久，离开视口用掉的那一段占多少（之后在视口外一下子跳到下面，再升上来）。
 * 从下面升回来的那一段起步快、收得干脆（用户嫌原来的 easeOut 拖），离开那一段是渐快的 easeIn。
 */
/** 纸里那一面的淡入淡出，时机按这一次的动法（custom）。 */
export const PAPER_FACE_VARIANTS = {
  hidden: { opacity: 0 },
  shown: (motion: PaperMotion) => ({ opacity: 1, transition: motion.faceIn }),
  gone: (motion: PaperMotion) => ({ opacity: 0, transition: motion.faceOut }),
};

/** 展开整页里细纸带多高；面板里矮一些（用户要的，2026-11-07），展开时长到这么高。 */
export const SLIM_HEIGHT = 36;
const PANEL_SLIM_HEIGHT = 28;

// The right-hand Now Playing host has its own size and toolbar.
export const PANEL_SLIM_SHIFT = 160;
export function panelPaperFrame(slot: "band" | number, width: number, height: number): PaperFrame {
  return {
    left: 0,
    width,
    top: slot === "band" ? 0 : height - [104, 70, 36][slot],
    height: slot === "band" ? 64 : PANEL_SLIM_HEIGHT,
  };
}
