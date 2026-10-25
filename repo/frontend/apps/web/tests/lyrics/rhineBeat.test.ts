import { describe, expect, it } from "bun:test";
import { RhineBeatDetector } from "@/lib/lyrics/rhine/beat";

const DT = 1 / 60;
const BINS = 1024;
// 40-160 Hz at 1024 bins over 24 kHz.
const KICK_BINS = [1, 7] as const;
const SNARE_BINS = [12, 128] as const;

function random(seed: number) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 2 ** 32;
  };
}

/** Steady noise around `floor`, with each kick decaying over a few frames like the analyser's smoothing. */
function render(
  seconds: number,
  {
    floor = 120,
    hits = [] as number[],
    peak = 230,
    bins = KICK_BINS as readonly [number, number],
    hold = false,
  } = {},
) {
  const next = random(7);
  const frames: Uint8Array[] = [];
  for (let frame = 0; frame < seconds / DT; frame++) {
    const time = frame * DT;
    const spectrum = new Uint8Array(BINS);
    for (let bin = 0; bin < BINS; bin++) spectrum[bin] = floor + Math.round((next() - 0.5) * 12);
    const age = Math.min(...hits.map((hit) => (time >= hit ? time - hit : Infinity)));
    const energy = hold && age !== Infinity ? 1 : age < 0.1 ? 0.6 ** (age * 60) : 0;
    for (let bin = bins[0]; bin < bins[1]; bin++)
      spectrum[bin] = Math.round(spectrum[bin] + (peak - floor) * energy);
    frames.push(spectrum);
  }
  return frames;
}

function detect(frames: Uint8Array[]) {
  const detector = new RhineBeatDetector();
  const onsets: { band: number; time: number; strength: number }[] = [];
  frames.forEach((spectrum, frame) => {
    detector.update(spectrum, DT).onsets.forEach((strength, band) => {
      if (strength > 0) onsets.push({ band, time: frame * DT, strength });
    });
  });
  return onsets;
}

describe("RhineBeatDetector", () => {
  it("finds every kick once and nothing in the other bands", () => {
    const hits = [1, 1.5, 2, 2.5, 3, 3.5];
    const onsets = detect(render(4, { hits }));
    expect(onsets.map((onset) => onset.band)).toEqual(hits.map(() => 0));
    onsets.forEach((onset, index) => expect(Math.abs(onset.time - hits[index])).toBeLessThan(0.05));
    for (const onset of onsets) expect(onset.strength).toBeGreaterThanOrEqual(0.4);
  });

  it("hears soft kicks between accented ones", () => {
    // The same noise seed renders both, so merging keeps one noise floor.
    const strong = render(8, { hits: [1, 2, 3, 4, 5, 6, 7], peak: 200 });
    const soft = render(8, { hits: [1.5, 2.5, 3.5, 4.5, 5.5, 6.5, 7.5], peak: 140 });
    const merged = strong.map((frame, index) =>
      frame.map((value, bin) => Math.max(value, soft[index][bin])),
    );
    expect(detect(merged).filter((onset) => onset.band === 0)).toHaveLength(14);
  });

  it("stays silent on steady noise", () => {
    expect(detect(render(3))).toEqual([]);
  });

  it("reports a sustained note only where it starts", () => {
    const onsets = detect(render(3, { hits: [1], hold: true }));
    expect(onsets).toHaveLength(1);
    expect(onsets[0].time).toBeCloseTo(1, 1);
  });

  it("merges hits closer than the refractory window", () => {
    expect(detect(render(2, { hits: [1, 1.05] }))).toHaveLength(1);
  });

  it("adapts to a quiet passage after a loud one", () => {
    const loud = render(3, { hits: [0.5, 1, 1.5, 2, 2.5] });
    const quiet = render(3, { floor: 60, peak: 110, hits: [1, 1.5, 2, 2.5] });
    const onsets = detect([...loud, ...quiet]).filter((onset) => onset.time >= 4);
    expect(onsets).toHaveLength(4);
  });

  it("detects snare attacks in the middle band", () => {
    const onsets = detect(render(3, { hits: [1, 2], bins: SNARE_BINS }));
    expect(onsets.map((onset) => onset.band)).toEqual([1, 1]);
  });

  it("ignores a missing spectrum and a changed bin count", () => {
    const detector = new RhineBeatDetector();
    expect(detector.update(undefined, DT).onsets).toEqual([0, 0, 0]);
    detector.update(new Uint8Array(BINS).fill(40), DT);
    expect(detector.update(new Uint8Array(256).fill(250), DT).onsets).toEqual([0, 0, 0]);
  });

  it("levels the spectrum from bass to treble", () => {
    const detector = new RhineBeatDetector();
    const spectrum = new Uint8Array(BINS).map((_, bin) => (bin < 20 ? 230 : 60));
    let levels: Float32Array = new Float32Array(0);
    for (let frame = 0; frame < 30; frame++) levels = detector.update(spectrum, DT).levels;
    expect(levels[0]).toBeGreaterThan(0.8);
    expect(levels[levels.length - 1]).toBe(0);
  });
});
