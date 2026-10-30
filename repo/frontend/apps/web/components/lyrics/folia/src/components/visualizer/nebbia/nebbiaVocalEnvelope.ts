// src/components/visualizer/nebbia/nebbiaVocalEnvelope.ts
// The shape of the vocal-stem envelope that 雾笺's rain can follow. Upstream reads it from
// services/analysis/vocalEnvelope.ts (an htdemucs run per track); Scopify has no stem analysis, so
// nothing produces one and the rain always follows the 1-3.5 kHz band of the mix, as upstream does
// until a track is analysed. The type and frame rate stay so nebbiaHits.ts is unchanged.

export const VOCAL_FPS = 50;

export interface VocalEnvelope {
  fps: number;
  /** Level per frame, dB. */
  db: Float32Array;
  /** The track's loud singing, dB: the 97th percentile of `db`. */
  top: number;
  /** Frames where a sung syllable starts, ascending. */
  onsets: Uint32Array;
  /** The first frame read: before it the stem was not separated. Missing for the whole track. */
  from?: number;
}
