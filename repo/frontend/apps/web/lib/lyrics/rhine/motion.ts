import type { RhineAudioSample } from "@/types/rhineBackground";

export const smooth = (value: number) => {
  const t = Math.min(1, Math.max(0, value));
  return t * t * t * (t * (t * 6 - 15) + 10);
};

// RhineLabUI's two slow, offset breathing cycles.
export function idleWave(row: number, lane: number, time: number) {
  return 0.075 * Math.sin(time * Math.PI * 2 / 8 + row * 0.3 - lane * 0.45)
    + 0.027 * Math.sin(time * Math.PI * 2 / 13 - row * 0.17 + lane * 0.3);
}

export class RhineEnvelope {
  readonly bands: RhineAudioSample = { low: 0, mid: 0, high: 0, activity: 0 };

  update(sample: RhineAudioSample, enabled: boolean, dt: number) {
    for (const key of ["low", "mid", "high", "activity"] as const) {
      const value = sample[key];
      const target = enabled && Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0;
      const rising = target > this.bands[key];
      const rate = key === "activity" ? (rising ? 3 : 1.5) : (rising ? 16 : 3.2);
      this.bands[key] += (target - this.bands[key]) * (1 - Math.exp(-dt * rate));
    }
    return this.bands;
  }
}
