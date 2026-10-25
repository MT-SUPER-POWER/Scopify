import { RHINE_SPECTRUM_COLUMNS, RhineBeatDetector } from "./beat";
import { smooth } from "./motion";
import type { RhineBeatFrame, RhineFieldPulse, RhineThemeCell } from "@/types/rhineRuntime";

const KICK_LIFE = 1.6;
const LIFT_LIFE = 1.5;
// Snare lifts step around the archive lane instead of hitting the same column twice.
const LIFT_LANES = [-1, 1, -2, 2, 0, -3, 3];

const bell = (value: number, width: number) => Math.exp(-0.5 * (value / width) ** 2);

interface Hit extends RhineFieldPulse {
  strength: number;
}

/** A kick's ring: faster and shorter than the selection ripple, so a bar of kicks never piles up. */
function kickRing(rowOffset: number, laneOffset: number, age: number) {
  const phase = Math.hypot(rowOffset, laneOffset * 2.2) - age * 14;
  return (
    0.55 * smooth(age / 0.06) * Math.exp(-age * 2.2) * Math.cos(phase * 0.5) * bell(phase, 2.6)
  );
}

/**
 * Beat style: kicks ring out from the archive, snares lift a column, hats
 * sparkle, and the spectrum underneath keeps sustained passages moving.
 */
export class RhineBeatField {
  private readonly detector = new RhineBeatDetector();
  private readonly kicks: Hit[] = [];
  private readonly lifts: Hit[] = [];
  private hat = { time: -Infinity, strength: 0, phase: 0 };
  private snares = 0;
  private levels = new Float32Array(RHINE_SPECTRUM_COLUMNS);
  /** The latest kick's lamp flash, 0-1. */
  flash = 0;

  update(
    spectrum: ArrayLike<number> | undefined,
    time: number,
    dt: number,
    origin: RhineThemeCell,
  ) {
    const frame: RhineBeatFrame = this.detector.update(spectrum, dt);
    const [kick, snare, hat] = frame.onsets;
    this.levels = frame.levels;
    this.flash *= Math.exp(-dt * 6);
    if (kick) {
      this.kicks.push({ row: origin.row, lane: origin.lane, time, strength: kick });
      this.flash = Math.max(this.flash, kick);
    }
    if (snare) {
      const lane = origin.lane + LIFT_LANES[this.snares++ % LIFT_LANES.length];
      this.lifts.push({ row: origin.row, lane, time, strength: snare });
    }
    if (hat) this.hat = { time, strength: hat, phase: Math.random() * Math.PI * 2 };
    while (this.kicks.length && time - this.kicks[0].time > KICK_LIFE) this.kicks.shift();
    while (this.lifts.length && time - this.lifts[0].time > LIFT_LIFE) this.lifts.shift();
  }

  /** x is the cell's projected horizontal position: bass on the left, treble on the right. */
  height(row: number, lane: number, x: number, time: number) {
    const position = Math.min(1, Math.max(0, x)) * (RHINE_SPECTRUM_COLUMNS - 1);
    const column = Math.min(RHINE_SPECTRUM_COLUMNS - 2, Math.floor(position));
    const level =
      this.levels[column] + (this.levels[column + 1] - this.levels[column]) * (position - column);
    let value = level * 0.55 * (0.7 + 0.3 * Math.sin(row * 0.3 - time * 1.6));
    let ring = 0;
    for (const kick of this.kicks)
      ring += kick.strength * kickRing(row - kick.row, lane - kick.lane, time - kick.time);
    value += Math.max(-0.5, Math.min(0.5, ring));
    for (const lift of this.lifts) {
      const age = time - lift.time;
      value +=
        lift.strength *
        0.7 *
        smooth(age / 0.05) *
        Math.exp(-age * 3.2) *
        bell(row - lift.row, 9) *
        bell(lane - lift.lane, 0.45);
    }
    const age = time - this.hat.time;
    if (age < 0.6)
      value +=
        0.07 *
        this.hat.strength *
        Math.exp(-age * 9) *
        Math.max(0, Math.sin(row * 1.9 - lane * 2.6 + this.hat.phase)) ** 6;
    return value;
  }
}
