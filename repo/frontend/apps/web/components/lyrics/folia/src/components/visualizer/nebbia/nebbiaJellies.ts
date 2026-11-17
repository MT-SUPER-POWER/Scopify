import type { NebbiaAquaUniforms } from "./nebbiaGlUtils";
import { NEBBIA_MAX_JELLIES, type NebbiaTuning } from "./types";

// src/components/visualizer/nebbia/nebbiaJellies.ts
// 水族箱的水母（窗外是水族箱时运行时每帧调）：每只自己的节奏一收一缩，缩的时候往上窜一点，慢慢浮上去，
// 浮出水面上沿就换个位置从底下再来。位置、大小、收缩、颜色算好写进两个数组，着色器（nebbiaJellyGlsl.ts）只读。
// 颜色一半是固定的几种鲜艳色、一半取主题的灯光色，近的大而亮，远的小而暗。

type Rgb = [number, number, number];

interface Jelly {
  xf: number;
  y: number;
  depth: number;
  rate: number;
  phase: number;
  rise: number;
  hue: number;
  seed: number;
}

const VIVID: Rgb[] = [
  [1, 0.35, 0.72],
  [0.35, 0.8, 1],
  [0.72, 0.5, 1],
  [1, 0.72, 0.35],
];
/** 浮到这里（画面上沿外）就从 BOTTOM 再来。 */
const TOP = -0.35,
  BOTTOM = 1.35;
/** 0..1 的伪随机，只由 n 决定。 */
const rand = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
const spawn = (i: number, seed: number, y: number): Jelly => ({
  xf: rand(seed * 3.1 + i),
  y,
  depth: rand(seed * 5.7 + i * 1.3),
  rate: 1.6 + 0.9 * rand(seed * 2.3 + i),
  phase: rand(seed + i * 7.3) * Math.PI * 2,
  rise: 0.012 + 0.012 * rand(seed * 9.1 + i),
  hue: rand(seed * 4.4 + i * 11.0),
  seed,
});

export class NebbiaJellies {
  private readonly list: Jelly[] = Array.from({ length: NEBBIA_MAX_JELLIES }, (_, i) =>
    spawn(i, i + 1, TOP + rand(i * 13.7) * (BOTTOM - TOP)),
  );
  private palette: Rgb[] = [
    [1, 0.81, 0.54],
    [0.54, 0.8, 1],
    [0.8, 0.54, 1],
  ];
  /** 主题的三个灯光色（nebbiaPalette.ts 的 la、lb、lc）。 */
  setPalette(la: Rgb, lb: Rgb, lc: Rgb) {
    this.palette = [la, lb, lc];
  }

  /** 走一帧，用窗外时钟推进水母，把位置与颜色写进 out。 */
  step(out: NebbiaAquaUniforms, dt: number, time: number, aspect: number, tuning: NebbiaTuning) {
    const count = Math.round(tuning.jellies);
    const { jelly, jellyColor } = out;
    for (let i = 0; i < count; i += 1) {
      let j = this.list[i];
      j.phase += dt * j.rate;
      const swim = Math.max(Math.sin(j.phase), 0);
      j.y -= dt * j.rise * (1 + 0.9 * swim);
      if (j.y < TOP) j = this.list[i] = spawn(i, j.seed + NEBBIA_MAX_JELLIES, BOTTOM);
      const x = (j.xf + 0.02 * Math.sin(time * 0.15 + j.hue * 10)) * (aspect + 0.2) - 0.1;
      const o = i * 4;
      jelly[o] = x;
      jelly[o + 1] = j.y;
      jelly[o + 2] = (0.03 + 0.055 * j.depth) * tuning.jellySize;
      jelly[o + 3] = swim ** 3;
      const vivid = VIVID[Math.floor(j.hue * 4) % 4],
        theme = this.palette[Math.floor(((j.hue * 3.7) % 1) * 3)];
      const shade = 0.45 + 0.55 * j.depth;
      for (let c = 0; c < 3; c += 1)
        jellyColor[o + c] = (vivid[c] * 0.65 + theme[c] * 0.35) * shade;
      jellyColor[o + 3] = j.phase;
    }
    out.count = count;
  }
}
