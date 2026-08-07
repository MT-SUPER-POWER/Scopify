import { describe, expect, test } from "bun:test";

import {
  resolveSonnetFrameDecorSpec,
  resolveSonnetFrameLocalDimensions,
  SONNET_FRAME_DECOR_PROBABILITY,
  SONNET_FRAME_DECOR_VARIANTS,
} from "@/components/lyrics/folia/src/components/visualizer/sonnet/sonnetFrameDecor";
import type { SonnetSemanticSegment } from "@/components/lyrics/folia/src/components/visualizer/sonnet/types";

const segment = (text: string, index: number): SonnetSemanticSegment => ({
  text,
  startOffset: index * 10,
  endOffset: index * 10 + text.length,
  startTime: index,
  endTime: index + 1,
  wordIndices: [index],
  graphemes: Array.from(text, (char, charIndex) => ({
    char,
    startTime: index + charIndex / text.length,
    endTime: index + (charIndex + 1) / text.length,
  })),
  isWordLike: true,
});

describe("Sonnet frame decor", () => {
  test("restores local dimensions for quarter-turned text", () => {
    expect(
      resolveSonnetFrameLocalDimensions({
        measuredWidth: 48,
        measuredHeight: 240,
        rotation: Math.PI / 2,
      }),
    ).toEqual({ width: 240, height: 48 });
    expect(
      resolveSonnetFrameLocalDimensions({
        measuredWidth: 240,
        measuredHeight: 48,
        rotation: 0,
      }),
    ).toEqual({ width: 240, height: 48 });
  });

  test("assigns deterministic variants at the intended density", () => {
    const samples = Array.from({ length: 400 }, (_, index) => segment(`詞${index}`, index));
    const applied = samples.filter((item) => resolveSonnetFrameDecorSpec(item).applied);
    const variants = new Set(applied.map((item) => resolveSonnetFrameDecorSpec(item).variant));

    expect(resolveSonnetFrameDecorSpec(segment("明かり", 3))).toEqual(
      resolveSonnetFrameDecorSpec(segment("明かり", 3)),
    );
    expect(applied.length / samples.length).toBeGreaterThan(SONNET_FRAME_DECOR_PROBABILITY - 0.12);
    expect(applied.length / samples.length).toBeLessThan(SONNET_FRAME_DECOR_PROBABILITY + 0.12);
    expect(variants.size).toBe(SONNET_FRAME_DECOR_VARIANTS);
  });
});
