import type { NebbiaGlassMotion } from "./nebbiaDrops";
import type { VocalEnvelope } from "./nebbiaVocalEnvelope";

// src/components/visualizer/nebbia/nebbiaDrizzleRide.ts
// 智能动感模式「疏雨轻车」每帧读的那一份（从 createNebbiaRuntime.ts 拆出）。上游开着时车跟底鼓颠、雨跟人声轨；
// @note Scopify 没有鼓点与人声轨的分离，所以始终是上游「关着」时的样子：雨走频段、车随机颠，雨点、颠簸强度都按 1。

export class NebbiaDrizzleRide {
  /** 雨点正在跟的人声轨包络，没有时 null、退回频段。 */
  env: VocalEnvelope | null = null;
  /** 雨点强度：乘小雨点密度和大雨点大小。 */
  rain = 1;

  /** 开一帧的玻璃运动（车随机颠）；`env`、`rain` 随后读。 */
  step(motion: NebbiaGlassMotion, now: number, _T: number, frozen: boolean, _bump: number) {
    motion.beginFrame(now, frozen, true);
  }
}
