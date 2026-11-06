import { describe, expect, test } from "bun:test";
import { FacetMotion } from "@/lib/lyrics/facet/motion";
import type { FacetLyricSample } from "@/types/lyrics/facet/background";

const FRAME = 1 / 30;
const line = (lineIndex: number, progress = 0.5): FacetLyricSample => ({
  lineIndex,
  progress,
  singing: true,
});
/** Loud or quiet audio with no spectrum, so no onsets fire. */
const audio = (level: number) => ({ low: level, mid: level, high: level });

function run(
  motion: FacetMotion,
  frames: number,
  level: number | null,
  lyric: FacetLyricSample | null,
) {
  for (let index = 0; index < frames; index += 1) {
    motion.advance(FRAME, level === null ? null : audio(level), lyric, 1);
  }
}

describe("FacetMotion", () => {
  test("the flow only moves forward as frame time accumulates", () => {
    const motion = new FacetMotion("song");
    let previous = motion.frame(1).flow;
    for (let index = 0; index < 120; index += 1) {
      motion.advance(FRAME, null, null, 1);
      const { flow } = motion.frame(1);
      expect(flow).toBeGreaterThan(previous);
      previous = flow;
    }
  });

  test("a stopped background holds its pose until time advances", () => {
    const motion = new FacetMotion("song");
    run(motion, 3, 0.5, line(1));
    expect(motion.frame(1)).toEqual(motion.frame(1));
  });

  test("a new lyric line turns the hexagon, and the turn ends on the other face", () => {
    const motion = new FacetMotion("song");
    run(motion, 1, 0.5, line(0));
    expect(motion.frame(1).turning).toBe(1);
    run(motion, 60, 0.5, line(0));
    expect(motion.frame(1).turning).toBe(0);
    expect(motion.frame(1).blend).toBeCloseTo(0.5);
    run(motion, 60, 0.5, line(1));
    expect(motion.frame(1).blend).toBeCloseTo(0);
  });

  test("a line that stays current does not turn again", () => {
    const motion = new FacetMotion("song");
    run(motion, 60, 0.5, line(0));
    expect(motion.takeStats().turns).toBe(1);
    run(motion, 300, 0.5, line(0));
    expect(motion.takeStats().turns).toBe(0);
  });

  test("quick lines share a turn instead of spinning constantly", () => {
    const motion = new FacetMotion("song");
    for (let index = 0; index < 6; index += 1) run(motion, 6, 0.5, line(index));
    expect(motion.takeStats().turns).toBe(1);
  });

  test("loud music flows faster and fills more of the screen than quiet music", () => {
    const flowAfter = (level: number) => {
      const motion = new FacetMotion("song");
      run(motion, 60, 0.8, line(0));
      const before = motion.frame(1);
      run(motion, 120, level, line(0));
      const after = motion.frame(1);
      return { flowed: after.flow - before.flow, scale: after.scale, presence: after.presence };
    };
    const loud = flowAfter(0.8);
    const quiet = flowAfter(0.1);
    expect(loud.flowed).toBeGreaterThan(quiet.flowed * 2);
    expect(loud.scale).toBeGreaterThan(quiet.scale);
    expect(loud.presence).toBeGreaterThanOrEqual(quiet.presence);
  });

  test("a long passage at one level does not read as full volume once the song has been louder", () => {
    const motion = new FacetMotion("song");
    run(motion, 300, 0.2, line(0));
    run(motion, 300, 0.9, line(0));
    const chorus = motion.frame(1).scale;
    run(motion, 300, 0.45, line(0));
    expect(motion.frame(1).scale).toBeLessThan(chorus);
  });

  test("a gap with no singing fades the hexagon", () => {
    const motion = new FacetMotion("song");
    run(motion, 90, 0.8, line(0));
    const singing = motion.frame(1).presence;
    run(motion, 300, 0, { lineIndex: 0, progress: 1, singing: false });
    expect(motion.frame(1).presence).toBeLessThan(singing);
  });

  test("tears cannot repeat inside the refractory window", () => {
    const motion = new FacetMotion("song");
    motion.triggerTear(1);
    const first = motion.frame(1).tear;
    expect(first).not.toBeNull();
    motion.advance(FRAME, null, null, 1);
    motion.triggerTear(1);
    expect(motion.frame(1).tear).toEqual(first);
    run(motion, 200, null, null);
    motion.triggerTear(1);
    expect(motion.frame(1).tear).not.toBeNull();
    expect(motion.frame(1).tear).not.toEqual(first);
  });
});
