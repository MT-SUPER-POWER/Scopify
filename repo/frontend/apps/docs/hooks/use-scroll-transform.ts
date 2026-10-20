"use client";

import { type MotionValue, useTransform } from "framer-motion";

/**
 * 把滚动进度映射到输出值，并把关键帧补齐到 0–1。
 *
 * framer-motion 会把滚动驱动的 opacity / filter / clipPath 交给原生 ScrollTimeline；
 * WAAPI 在首尾没有关键帧时会回落到元素的底值（例如淡出后又慢慢淡回来），
 * 所以这里统一钳制到 0–1 并在两端补上保持帧。
 */
export function useScrollTransform<T>(
  progress: MotionValue<number>,
  input: readonly number[],
  output: readonly T[],
) {
  const offsets = input.map((offset) => Math.min(1, Math.max(0, offset)));
  const values = [...output];
  if (offsets[0]! > 0) {
    offsets.unshift(0);
    values.unshift(values[0]!);
  }
  if (offsets.at(-1)! < 1) {
    offsets.push(1);
    values.push(values.at(-1)!);
  }
  return useTransform(progress, offsets, values);
}
