import { STEM_MIXER_STEMS } from "@/constants/stemMixer";

import { HTDEMUCS_SEGMENT } from "./htdemucsWgsl/runtime";

export const STEM_SOURCES = STEM_MIXER_STEMS;

// Folia stemRange.ts, segment geometry and triangular overlap-add window.
export const stemSegmentStarts = (total: number, segment = HTDEMUCS_SEGMENT): number[] => {
  const stride = segment - Math.floor(segment / 4);
  const count = Math.max(1, Math.ceil(total / stride));
  return Array.from({ length: count }, (_, index) => index * stride);
};

export const stemSegmentWindow = (segment: number): Float32Array => {
  const overlap = Math.floor(segment / 4);
  const win = new Float32Array(segment).fill(1);
  for (let i = 0; i < overlap; i += 1) {
    const ramp = i / (overlap - 1);
    win[i] = ramp;
    win[segment - 1 - i] = ramp;
  }
  return win;
};
