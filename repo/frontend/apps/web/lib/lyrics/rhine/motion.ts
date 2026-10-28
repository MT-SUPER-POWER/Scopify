import type { RhineAudioSample } from "@/types/lyrics/rhine/background";

export const smooth = (value: number) => {
  const t = Math.min(1, Math.max(0, value));
  return t * t * t * (t * (t * 6 - 15) + 10);
};

const bell = (value: number, width: number) => Math.exp(-0.5 * (value / width) ** 2);

// RhineLabUI's two slow, offset breathing cycles.
export function idleWave(row: number, lane: number, time: number) {
  return (
    0.075 * Math.sin((time * Math.PI * 2) / 8 + row * 0.3 - lane * 0.45) +
    0.027 * Math.sin((time * Math.PI * 2) / 13 - row * 0.17 + lane * 0.3)
  );
}

// RhineLabUI's settling shoulders. Farther files rise later and ring once
// before resting, so the lane reads as one surface pushed up by the archive.
export function settlingRidge(distance: number, age: number) {
  const delayed = age - Math.abs(distance) * 0.065;
  const envelope = Math.max(-0.42, 2.15 - 0.17 * (Math.sqrt(distance * distance + 1) - 1));
  const ring = delayed > 0 ? Math.sin(delayed * 5.1) * Math.exp(-delayed * 1.3) : 0;
  return envelope * (smooth(delayed / 0.62) + 0.18 * ring * smooth(delayed / 0.16));
}

/** The showcase lane carries the whole ridge; every other lane follows at a quarter. */
export const laneFocus = (offset: number) => 0.25 + 0.75 * bell(offset, 0.55);

export const RIPPLE_LIFE = 3.2;

/** RhineLabUI's signed selection wave: one ring travelling eight rows per second. */
export function selectionRipple(rowOffset: number, laneOffset: number, age: number) {
  if (age < 0 || age > RIPPLE_LIFE) return 0;
  const phase = Math.hypot(rowOffset, laneOffset * 2.2) - age * 8;
  return (
    0.8 * smooth(age / 0.2) * Math.exp(-age * 1.15) * Math.cos(phase * 0.58) * bell(phase, 3.4)
  );
}

/** Critically damped follower; retargeting keeps the current velocity. */
export class Spring {
  velocity = 0;
  constructor(public value = 0) {}

  damp(target: number, rate: number, dt: number) {
    const delta = this.value - target;
    const impulse = this.velocity + rate * delta;
    const decay = Math.exp(-rate * dt);
    this.value = target + (delta + impulse * dt) * decay;
    this.velocity = (this.velocity - rate * impulse * dt) * decay;
  }
}

export class RhineEnvelope {
  readonly bands: RhineAudioSample = { low: 0, mid: 0, high: 0, activity: 0 };

  update(sample: RhineAudioSample, enabled: boolean, dt: number) {
    for (const key of ["low", "mid", "high", "activity"] as const) {
      const value = sample[key];
      const target = enabled && Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0;
      const rising = target > this.bands[key];
      const rate = key === "activity" ? (rising ? 3 : 1.5) : rising ? 16 : 3.2;
      this.bands[key] += (target - this.bands[key]) * (1 - Math.exp(-dt * rate));
    }
    return this.bands;
  }
}
