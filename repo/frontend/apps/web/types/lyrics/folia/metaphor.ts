import type { LyricRenderOverride } from "@/components/lyrics/folia/src/types";

export interface MetaphorTuning {
  /** 分辨率覆盖。全屏着色器不使用 MSAA。 */
  render: LyricRenderOverride;
  /** 镜头切换的快慢，越大一句里切得越多。 */
  cutPace: number;
  /** 推拉、手持晃动和倾斜的幅度。 */
  cameraMotion: number;
  /** 墨的边缘被流场推着晃的幅度。 */
  flow: number;
  /** 融球和装饰图形的多少。 */
  blobs: number;
  /** 半调网点的大小。 */
  halftone: number;
  /** 砂纸颗粒的强度。 */
  grain: number;
  /** 一部分镜头纸和墨对调。 */
  negative: boolean;
  /** 画面整体对调纸和墨。 */
  flip: boolean;
  /** 应用主题的关键字颜色。 */
  keywordColors: boolean;
  /** 句与句之间的漫墨和冲镜。 */
  transitions: boolean;
}

export type MetaphorNumberKey = {
  [K in keyof MetaphorTuning]: MetaphorTuning[K] extends number ? K : never;
}[keyof MetaphorTuning];
export type MetaphorBooleanKey = {
  [K in keyof MetaphorTuning]: MetaphorTuning[K] extends boolean ? K : never;
}[keyof MetaphorTuning];
