/** 均衡器曲线 SVG 的坐标系；外层用 `preserveAspectRatio="none"` 拉伸。 */
export const EQ_CURVE_WIDTH = 1000;
export const EQ_CURVE_HEIGHT = 240;

/** 增益 → 0（顶部 +max dB）到 1（底部 -max dB）之间的纵向比例。 */
export const gainToRatio = (gain: number, maxGain: number) => (maxGain - gain) / (2 * maxGain);

const format = (value: number) => value.toFixed(2);

/**
 * 用 Catmull-Rom 样条把各频段的增益连成一条平滑曲线。
 * 输出的命令结构固定（M + 11 段 C），framer-motion 可以直接在两条曲线之间插值。
 */
export const buildEqCurve = (gains: readonly number[], maxGain: number) => {
  const toY = (gain: number) => gainToRatio(gain, maxGain) * EQ_CURVE_HEIGHT;
  const bands = gains.map(
    (gain, index) => [((index + 0.5) / gains.length) * EQ_CURVE_WIDTH, toY(gain)] as const,
  );
  const points = [
    [0, bands[0]![1]] as const,
    ...bands,
    [EQ_CURVE_WIDTH, bands.at(-1)![1]] as const,
  ];

  let path = `M ${format(points[0]![0])} ${format(points[0]![1])}`;
  for (let index = 0; index < points.length - 1; index += 1) {
    const previous = points[index - 1] ?? points[index]!;
    const current = points[index]!;
    const next = points[index + 1]!;
    const afterNext = points[index + 2] ?? next;
    const control1 = [
      current[0] + (next[0] - previous[0]) / 6,
      current[1] + (next[1] - previous[1]) / 6,
    ];
    const control2 = [
      next[0] - (afterNext[0] - current[0]) / 6,
      next[1] - (afterNext[1] - current[1]) / 6,
    ];
    path += ` C ${format(control1[0]!)} ${format(control1[1]!)} ${format(control2[0]!)} ${format(control2[1]!)} ${format(next[0])} ${format(next[1])}`;
  }
  return path;
};

/** 曲线与 0 dB 基线之间的填充区域：提升在线上、衰减在线下。 */
export const buildEqArea = (gains: readonly number[], maxGain: number) =>
  `${buildEqCurve(gains, maxGain)} L ${EQ_CURVE_WIDTH} ${EQ_CURVE_HEIGHT / 2} L 0 ${EQ_CURVE_HEIGHT / 2} Z`;
