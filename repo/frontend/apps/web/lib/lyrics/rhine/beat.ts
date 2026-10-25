import type { RhineBeatFrame } from "@/types/rhineRuntime";

// The shared analyser publishes byte decibel magnitudes from 0 Hz to Nyquist.
// 48 kHz is the usual output rate; at 44.1 kHz every band sits 8% lower.
const NYQUIST = 24_000;
/** Kick, snare/vocal attacks and hats, in Hz. */
export const RHINE_BEAT_BANDS = [
  [40, 160],
  [300, 3_000],
  [5_000, 14_000],
] as const;
export const RHINE_SPECTRUM_COLUMNS = 12;
const COLUMN_RANGE = [50, 12_000] as const;
// Adaptive threshold: the last second's mean flux plus SPREAD deviations, never below FLOOR.
const MEMORY = 1;
const SPREAD = 1.6;
const FLOOR = 0.012;
/** Seconds of history the threshold needs before it can be trusted. */
const WARM_UP = 0.5;
/** Minimum seconds between two onsets of one band. */
const REFRACTORY = [0.18, 0.12, 0.09] as const;

const clamp = (value: number, low = 0, high = 1) => Math.min(high, Math.max(low, value));

function binRange(low: number, high: number, length: number): [number, number] {
  const start = Math.min(length - 1, Math.floor((low / NYQUIST) * length));
  return [start, Math.max(start + 1, Math.min(length, Math.ceil((high / NYQUIST) * length)))];
}

/**
 * Spectral-flux onset detector over the analyser bins. Each band reports the
 * frame where its rising energy first crosses an adaptive threshold, so loud
 * and quiet passages both produce beats and sustained notes produce none.
 */
export class RhineBeatDetector {
  private previous = new Float32Array(0);
  private readonly mean = [0, 0, 0];
  private readonly variance = [0, 0, 0];
  private readonly since = [Infinity, Infinity, Infinity];
  private readonly armed = [true, true, true];
  private warmth = 0;
  private readonly frame: RhineBeatFrame = {
    onsets: [0, 0, 0],
    levels: new Float32Array(RHINE_SPECTRUM_COLUMNS),
  };

  update(spectrum: ArrayLike<number> | undefined, dt: number): RhineBeatFrame {
    const { onsets, levels } = this.frame;
    onsets.fill(0);
    const length = spectrum?.length ?? 0;
    if (!spectrum || length < 8) {
      levels.fill(0);
      this.previous = new Float32Array(0);
      return this.frame;
    }
    dt = clamp(dt, 0, 0.1);
    // A new source or bin count has no previous frame to compare with.
    const fresh = this.previous.length !== length;
    if (fresh) {
      this.previous = new Float32Array(length);
      this.warmth = 0;
    }
    this.warmth += dt;
    const alpha = 1 - Math.exp(-dt / MEMORY);
    for (let band = 0; band < RHINE_BEAT_BANDS.length; band++) {
      const [start, end] = binRange(...RHINE_BEAT_BANDS[band], length);
      let rise = 0;
      for (let bin = start; bin < end; bin++)
        rise += Math.max(0, spectrum[bin] - this.previous[bin]);
      const flux = fresh ? 0 : rise / ((end - start) * 255);
      const threshold = this.mean[band] + SPREAD * Math.sqrt(this.variance[band]) + FLOOR;
      this.since[band] += dt;
      if (flux <= threshold) this.armed[band] = true;
      else if (this.armed[band] && this.since[band] >= REFRACTORY[band] && this.warmth >= WARM_UP) {
        // One onset per crossing: the analyser's smoothing spreads a hit over several frames.
        this.armed[band] = false;
        this.since[band] = 0;
        onsets[band] = clamp(0.4 + 0.6 * (flux / threshold - 1), 0.4, 1);
      }
      const delta = flux - this.mean[band];
      this.mean[band] += alpha * delta;
      this.variance[band] = (1 - alpha) * (this.variance[band] + alpha * delta * delta);
    }
    const [low, high] = COLUMN_RANGE;
    for (let column = 0; column < RHINE_SPECTRUM_COLUMNS; column++) {
      const from = low * (high / low) ** (column / RHINE_SPECTRUM_COLUMNS);
      const to = low * (high / low) ** ((column + 1) / RHINE_SPECTRUM_COLUMNS);
      const [start, end] = binRange(from, to, length);
      let sum = 0;
      for (let bin = start; bin < end; bin++) sum += spectrum[bin];
      // Music falls off towards the treble; lift the upper columns to a comparable height.
      const tilt = 0.14 * (column / (RHINE_SPECTRUM_COLUMNS - 1));
      const target = clamp((sum / ((end - start) * 255) + tilt - 0.4) / 0.45);
      const rate = target > levels[column] ? 18 : 4;
      levels[column] += (target - levels[column]) * (1 - Math.exp(-dt * rate));
    }
    for (let bin = 0; bin < length; bin++) this.previous[bin] = spectrum[bin];
    return this.frame;
  }
}
