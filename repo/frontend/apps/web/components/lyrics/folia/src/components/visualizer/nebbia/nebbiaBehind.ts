import type { VisualizerBackgroundConfig } from "../backgrounds/definition";
import type { NebbiaTuning } from "./types";

// src/components/visualizer/nebbia/nebbiaBehind.ts
// 雾笺窗外是什么：自己画的雨夜街景，或者共用背景。设置里选了共用背景，或者播放页透明（共用背景卸掉、透出桌面）时，
// 雾笺不画窗外，画布带透明通道（nebbiaGl.ts 的 seeThrough）。

/**
 * 雾笺这一帧要不要透出后面：tuning 选了共用背景，或者播放页透明。样式预览也把背景标成透明
 * 来表示「不画背景」，预览里不算播放页透明，小图照样是街景。
 */
export const nebbiaSeesThrough = (
  tuning: NebbiaTuning,
  background: VisualizerBackgroundConfig | undefined,
  isPreview = false,
) => tuning.behind === "backdrop" || (!isPreview && Boolean(background?.transparent));
