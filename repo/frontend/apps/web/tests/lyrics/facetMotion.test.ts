import { describe, expect, test } from "bun:test";
import { FacetMotion } from "@/lib/lyrics/facet/motion";
import type { FacetLyricSample } from "@/types/lyrics/facet/background";

const FRAME = 1 / 30;
const line = (
  lineIndex: number,
  wordsSung = 0,
  chorus: boolean | null = null,
): FacetLyricSample => ({
  lineIndex,
  progress: 0.5,
  singing: true,
  wordsSung,
  chorus,
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

  test("a lyric line changing does not move the hexagon", () => {
    const motion = new FacetMotion("song");
    for (let index = 0; index < 10; index += 1) run(motion, 30, null, line(index));
    expect(motion.takeStats().turns).toBe(0);
  });

  test("a change of section turns the hexagon a sixth of a circle, only once it has lasted", () => {
    const motion = new FacetMotion("song");
    run(motion, 300, 0.9, line(0));
    run(motion, 300, 0.2, line(0));
    motion.takeStats();
    const before = motion.frame(1).blend;
    run(motion, 30, 0.9, line(0));
    expect(motion.takeStats().turns).toBe(0);
    run(motion, 150, 0.9, line(0));
    expect(motion.takeStats().turns).toBe(1);
    run(motion, 90, 0.9, line(0));
    expect(motion.frame(1).blend - before).toBeCloseTo(1 / 6);
  });

  test("the hexagon's size moves slowly, so it cannot pulse with the beat", () => {
    const motion = new FacetMotion("song");
    run(motion, 300, 0.2, line(0));
    const before = motion.frame(1).scale;
    run(motion, 1, 0.9, line(0));
    expect(Math.abs(motion.frame(1).scale - before)).toBeLessThan(0.02);
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
    run(motion, 300, 0, { lineIndex: 0, progress: 1, singing: false, wordsSung: 0, chorus: null });
    expect(motion.frame(1).presence).toBeLessThan(singing);
  });

  test("each sung word lights the next facet of the spiral, which then settles", () => {
    const motion = new FacetMotion("song");
    run(motion, 1, 0.5, line(0, 1));
    expect(motion.frame(1).lights[0]).toBeGreaterThan(200);
    expect(motion.frame(1).lights[1]).toBe(0);
    run(motion, 1, 0.5, line(0, 2));
    expect(motion.frame(1).lights[1]).toBeGreaterThan(200);
    run(motion, 300, 0.5, line(0, 2));
    expect(motion.frame(1).lights[0]).toBeGreaterThan(60);
    expect(motion.frame(1).lights[0]).toBeLessThan(120);
  });

  test("a new line lets the last line's facets fade and sends out a ring", () => {
    const motion = new FacetMotion("song");
    run(motion, 300, 0.5, line(0, 2));
    run(motion, 1, 0.5, line(1));
    const rings = Array.from(motion.frame(1).rings);
    expect(Math.max(...rings.filter((_, index) => index % 2 === 1))).toBeGreaterThan(0.9);
    run(motion, 300, 0.5, line(1));
    expect(motion.frame(1).lights[0]).toBe(0);
    expect(motion.takeStats().lines).toBe(2);
  });

  test("words beyond what the window shows wrap to facets that can be seen", () => {
    const motion = new FacetMotion("song");
    run(motion, 1, 0.5, line(0, 60));
    const { lights } = motion.frame(1);
    expect(lights[0]).toBeGreaterThan(0);
    expect(lights[100]).toBe(0);
  });

  test("the chorus opens the window across the screen and closes after it", () => {
    const motion = new FacetMotion("song");
    run(motion, 60, 0.5, line(0, 0, false));
    const verse = motion.frame(1).open;
    run(motion, 300, 0.5, line(0, 0, true));
    expect(motion.frame(1).open).toBeGreaterThan(0.95);
    expect(motion.takeStats().turns).toBe(1);
    run(motion, 600, 0.5, line(0, 0, false));
    expect(motion.frame(1).open).toBeLessThan(verse + 0.15);
  });

  test("a chorus entry slips the picture faintly at normal intensity and not at all when calm", () => {
    const enter = (intensity: "calm" | "normal") => {
      const motion = new FacetMotion("song");
      motion.intensity = intensity;
      run(motion, 30, 0.5, line(0, 0, false));
      run(motion, 1, 0.5, line(0, 0, true));
      return motion.frame(1);
    };
    expect(enter("calm").tear).toBeNull();
    expect(enter("normal").burst).toBeLessThan(0.5);
    expect(enter("normal").tear).not.toBeNull();
  });

  test("only the highest intensity tears the picture", () => {
    for (const intensity of ["calm", "normal"] as const) {
      const motion = new FacetMotion("song");
      motion.intensity = intensity;
      motion.triggerTear(1);
      expect(motion.frame(1).tear).toBeNull();
      expect(motion.frame(1).burst).toBe(0);
    }
  });

  test("tears cannot repeat inside the refractory window", () => {
    const motion = new FacetMotion("song");
    motion.intensity = "chaotic";
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
