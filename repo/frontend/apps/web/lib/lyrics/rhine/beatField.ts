import { RHINE_SPECTRUM_COLUMNS, RhineBeatDetector } from "./beat";
import { smooth, Spring } from "./motion";
import type { RhineBeatFrame, RhineFieldPulse, RhineThemeCell } from "@/types/lyrics/rhine/runtime";

const KICK_LIFE = 2;
const LIFT_LIFE = 2;
const HAT_LIFE = 0.6;
// Every hit eases in from standing still, so it swells through the field rather than shoving it up.
const KICK_ATTACK = 0.24;
const LIFT_ATTACK = 0.26;
const HAT_ATTACK = 0.08;
const FLASH_ATTACK_RATE = 28;
// Snare lifts step around the archive lane instead of hitting the same column twice.
const LIFT_LANES = [-1, 1, -2, 2, 0, -3];

const bell = (value: number, width: number) => Math.exp(-0.5 * (value / width) ** 2);

interface Hit extends RhineFieldPulse {
  strength: number;
}

interface Hat {
  time: number;
  strength: number;
  phase: number;
}

/** A kick's ring: faster and shorter than the selection ripple, so a bar of kicks never piles up. */
function kickRing(rowOffset: number, laneOffset: number, age: number) {
  const phase = Math.hypot(rowOffset, laneOffset * 2.2) - age * 11;
  return (
    0.42 *
    smooth(age / KICK_ATTACK) *
    Math.exp(-age * 2.2) *
    Math.cos(phase * 0.42) *
    bell(phase, 3.4)
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
  private readonly hats: Hat[] = [];
  private snares = 0;
  private readonly levels = new Float32Array(RHINE_SPECTRUM_COLUMNS);
  private flashTarget = 0;
  private readonly flashLight = new Spring();

  update(
    spectrum: ArrayLike<number> | undefined,
    time: number,
    dt: number,
    origin: RhineThemeCell,
  ) {
    const frame: RhineBeatFrame = this.detector.update(spectrum, dt);
    const [kick, snare, hat] = frame.onsets;
    // Each column leans on its neighbours, so the surface has no kink between two bands.
    for (let column = 0; column < RHINE_SPECTRUM_COLUMNS; column++) {
      const left = frame.levels[Math.max(0, column - 1)];
      const right = frame.levels[Math.min(RHINE_SPECTRUM_COLUMNS - 1, column + 1)];
      this.levels[column] = 0.25 * left + 0.5 * frame.levels[column] + 0.25 * right;
    }
    this.flashTarget *= Math.exp(-dt * 6);
    if (kick) {
      this.kicks.push({ row: origin.row, lane: origin.lane, time, strength: kick });
      this.flashTarget = Math.max(this.flashTarget, kick);
    }
    if (snare) {
      const lane = origin.lane + LIFT_LANES[this.snares++ % LIFT_LANES.length];
      this.lifts.push({ row: origin.row, lane, time, strength: snare });
    }
    if (hat) this.hats.push({ time, strength: hat, phase: Math.random() * Math.PI * 2 });
    this.flashLight.damp(this.flashTarget, FLASH_ATTACK_RATE, dt);
    while (this.kicks.length && time - this.kicks[0].time > KICK_LIFE) this.kicks.shift();
    while (this.lifts.length && time - this.lifts[0].time > LIFT_LIFE) this.lifts.shift();
    while (this.hats.length && time - this.hats[0].time > HAT_LIFE) this.hats.shift();
  }

  /** The latest kick's lamp flash, 0-1. */
  get flash() {
    return Math.max(0, this.flashLight.value);
  }

  /** The spectrum at x, the cell's place across the visible field: bass on the left, treble on the right. */
  level(x: number) {
    const position = Math.min(1, Math.max(0, x)) * (RHINE_SPECTRUM_COLUMNS - 1);
    const column = Math.min(RHINE_SPECTRUM_COLUMNS - 2, Math.floor(position));
    return (
      this.levels[column] + (this.levels[column + 1] - this.levels[column]) * (position - column)
    );
  }

  height(row: number, lane: number, x: number, time: number) {
    let value = this.level(x) * 0.55 * (0.7 + 0.3 * Math.sin(row * 0.3 - time * 1.6));
    let ring = 0;
    for (const kick of this.kicks)
      ring += kick.strength * kickRing(row - kick.row, lane - kick.lane, time - kick.time);
    value += Math.max(-0.5, Math.min(0.5, ring));
    for (const lift of this.lifts) {
      const age = time - lift.time;
      value +=
        lift.strength *
        0.46 *
        smooth(age / LIFT_ATTACK) *
        Math.exp(-age * 2.4) *
        bell(row - lift.row, 9) *
        bell(lane - lift.lane, 0.7);
    }
    for (const hat of this.hats) {
      const age = time - hat.time;
      value +=
        0.06 *
        hat.strength *
        smooth(age / HAT_ATTACK) *
        Math.exp(-age * 8) *
        Math.max(0, Math.sin(row * 1.9 - lane * 2.6 + hat.phase)) ** 6;
    }
    return value;
  }
}
