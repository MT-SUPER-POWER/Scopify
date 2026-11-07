// Adapted from RhineLabUI (d9ecb6c); see SOURCE.md and LICENSE.RhineLabUI.
import { RHINE_RHYTHM_STYLES } from "@/constants/rhineBackground";
import type {
  RhineAudioSample as MusicBands,
  RhineRhythmStyle as RhythmStyle,
} from "@/types/lyrics/rhine/background";
import type { RhythmFrame } from "@/types/lyrics/rhine/runtime";
import type { RhineBeatField } from "./beatField";
import { idleWave } from "./motion";

const clamp = (value: number, low = 0, high = 1) => Math.min(high, Math.max(low, value));

export interface RhythmSources {
  bands: MusicBands;
  beat: RhineBeatField;
}

type RhythmRule = (
  row: number,
  lane: number,
  x: number,
  time: number,
  sources: RhythmSources,
  strength: number,
) => number;

/**
 * One rule per style, and each is the whole motion of the field: no rule builds on another, and
 * nothing is added on top of the chosen one. x is the cell's place across the part of the screen
 * the lyric fade leaves visible, left=0, right=1.
 */
const RHYTHM_RULES: Record<RhythmStyle, RhythmRule> = {
  still: () => 0,
  breath: (row, lane, _x, time, _sources, strength) => idleWave(row, lane, time) * strength,
  legacy: (row, lane, _x, time, { bands }, strength) => {
    const bass = bands.low * 0.8 * (0.5 + 0.5 * Math.sin(row * 0.29 - lane * 0.5 - time * 2.7));
    const middle = bands.mid * 0.48 * (0.5 + 0.5 * Math.sin(row * 0.72 + lane * 0.9 - time * 4.3));
    const treble =
      bands.high * 0.18 * Math.pow(Math.max(0, Math.sin(row * 1.7 - lane * 2.2 - time * 6.4)), 4);
    return clamp((bass + middle + treble) * strength, 0, 1.8);
  },
  // Broad spectrum ridges, bass to treble across the visible part of the screen.
  wave: (row, _lane, x, time, { beat }, strength) =>
    beat.level(x) * (0.72 + 0.28 * Math.sin(row * 0.32 - time * 2.2)) * 0.95 * strength,
  // Layered travelling currents; vocals and sustained treble also carry motion.
  lift: (row, lane, _x, time, { bands }, strength) =>
    (bands.low * 0.62 * (0.55 + 0.45 * Math.sin(row * 0.22 + lane * 0.18 - time * 1.8)) +
      bands.mid * 0.42 * (0.55 + 0.45 * Math.sin(row * 0.38 - lane * 0.27 - time * 2.8)) +
      bands.high * 0.28 * (0.55 + 0.45 * Math.sin(row * 0.62 + lane * 0.4 - time * 4.1))) *
    strength,
  beat: (row, lane, x, time, { beat }, strength) => beat.height(row, lane, x, time) * strength,
};

/** Whether a style listens to the music at all. */
export const rhythmHearsMusic = (style: RhythmStyle) => style !== "still" && style !== "breath";

/** The chosen style owns the field; two only meet for the moment it takes to change over. */
export class RhythmMotion {
  private readonly weights: Record<RhythmStyle, number>;

  constructor(style: RhythmStyle) {
    this.weights = { still: 0, breath: 0, legacy: 0, wave: 0, lift: 0, beat: 0 };
    this.weights[style] = 1;
  }

  update(dt: number, style: RhythmStyle): RhythmFrame {
    for (const key of RHINE_RHYTHM_STYLES)
      this.weights[key] +=
        ((style === key ? 1 : 0) - this.weights[key]) * (1 - Math.exp(-clamp(dt, 0, 0.1) * 8));
    return { style: this.weights };
  }
}

export function rhythmHeight(
  row: number,
  lane: number,
  x: number,
  time: number,
  sources: RhythmSources,
  strength: number,
  frame: RhythmFrame,
) {
  const amount = clamp(strength, 0, 2);
  let value = 0;
  for (const style of RHINE_RHYTHM_STYLES) {
    const weight = frame.style[style];
    if (weight > 0.001)
      value += weight * RHYTHM_RULES[style](row, lane, clamp(x), time, sources, amount);
  }
  return value;
}
