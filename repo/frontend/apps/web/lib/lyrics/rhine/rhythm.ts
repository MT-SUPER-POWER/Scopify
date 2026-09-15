 // Adapted from RhineLabUI (d9ecb6c); see SOURCE.md and LICENSE.RhineLabUI.
import type { RhineAudioSample as MusicBands, RhineRhythmStyle as RhythmStyle } from "@/types/rhineBackground";
import type { RhythmFrame } from "@/types/rhineRuntime";
const clamp = (value: number, low = 0, high = 1) => Math.min(high, Math.max(low, value));
export function musicDisplacement(row: number, lane: number, time: number, bands: MusicBands, strength: number) {
  const bass = bands.low * .8 * (.5 + .5 * Math.sin(row * .29 - lane * .5 - time * 2.7));
  const middle = bands.mid * .48 * (.5 + .5 * Math.sin(row * .72 + lane * .9 - time * 4.3));
  const treble = bands.high * .18 * Math.pow(Math.max(0, Math.sin(row * 1.7 - lane * 2.2 - time * 6.4)), 4);
  return clamp((bass + middle + treble) * clamp(strength, 0, 2), 0, 1.8);
}
/** Crossfade styles without a beat gate: sustained notes remain visible. */
export class RhythmMotion {
  private weights = { legacy: 1, wave: 0, lift: 0 };
  update(_bands: MusicBands, _time: number, dt: number, style: RhythmStyle): RhythmFrame {
    for (const key of ['legacy', 'wave', 'lift'] as const) this.weights[key] += ((style === key ? 1 : 0) - this.weights[key]) * (1 - Math.exp(-clamp(dt, 0, .1) * 5));
    return { style: { ...this.weights } };
  }
}
/** x is the card's projected horizontal position, left=0, right=1. */
export function rhythmDisplacement(row: number, lane: number, time: number, bands: MusicBands, strength: number, frame: RhythmFrame, x = .5) {
  x = clamp(x);
  const smooth = (v: number) => v * v * (3 - 2 * v);
  const right = smooth(clamp((x - .5) * 2));
  const left = 1 - smooth(clamp(x * 2));
  const middle = 1 - left - right;
  const spectrum = bands.low * left + bands.mid * middle + bands.high * right;
  // A: broad, screen-aligned spectrum ridges, continuous across band boundaries.
  const wave = spectrum * (.72 + .28 * Math.sin(row * .32 - time * 2.2)) * .95;
  // B: layered travelling currents; vocals and sustained treble also carry motion.
  const flow = bands.low * .62 * (.55 + .45 * Math.sin(row * .22 + lane * .18 - time * 1.8))
    + bands.mid * .42 * (.55 + .45 * Math.sin(row * .38 - lane * .27 - time * 2.8))
    + bands.high * .28 * (.55 + .45 * Math.sin(row * .62 + lane * .4 - time * 4.1));
  return musicDisplacement(row, lane, time, bands, strength) * frame.style.legacy
    + (frame.style.wave * wave + frame.style.lift * flow) * clamp(strength, 0, 2);
}
