import { describe, expect, test } from "bun:test";

import { LANDING_STAGE_SCENES } from "@/constants/landing-stage";
import { LANDING_VISUALIZER_MODES } from "@/constants/marketing";
import {
  STAGE_LINE_SECONDS,
  buildStageLines,
  resolveCurrentLineIndex,
  resolveLoopDuration,
  resolveLoopTime,
} from "@/lib/marketing/landing-stage-timeline";

describe("landing stage timeline", () => {
  test("gives every lyric animation its own verse and colour", () => {
    const verses = new Set<string>();
    for (const mode of LANDING_VISUALIZER_MODES) {
      const scene = LANDING_STAGE_SCENES[mode.value];
      expect(scene).toBeDefined();
      expect(scene!.accent).toMatch(/^#[0-9a-f]{6}$/i);
      expect(scene!.verse.length).toBeGreaterThan(0);
      verses.add(scene!.verse.join(""));
    }
    expect(verses.size).toBe(LANDING_VISUALIZER_MODES.length);
  });

  test("sings a verse line after line and loops it", () => {
    const lines = buildStageLines("still", ["什么都不动，", "只有声音经过这里。"]);
    const loop = resolveLoopDuration(lines);
    expect(loop).toBe(STAGE_LINE_SECONDS * 2);
    expect(lines[1]!.startTime).toBe(lines[0]!.endTime);
    expect(lines[1]!.words.at(-1)!.endTime).toBeCloseTo(loop);
    expect(resolveCurrentLineIndex(lines, STAGE_LINE_SECONDS + 0.1)).toBe(1);
    expect(resolveLoopTime(loop + 1.25, loop)).toBeCloseTo(1.25);
  });
});
