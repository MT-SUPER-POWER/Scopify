import type { RadioBrowseRange, RadioWallMetrics, RadioWallSlot } from "@/types/playlist/radioWall";

export function radioBrowseRange(count: number, anchor: number, wrap: boolean): RadioBrowseRange {
  if (count < 1) return { min: 0, max: 0 };
  const reach = count - 1;
  return wrap ? { min: anchor - reach, max: anchor + reach } : { min: 0, max: reach };
}

export function radioTrackIndex(position: number, count: number) {
  return ((position % count) + count) % count;
}

/** Only the slots around the current viewport allocate artwork, including while the rail moves. */
export function radioWallSlots(
  position: number,
  reach: number,
  count: number,
  range: RadioBrowseRange,
  hasUnknownTrack: boolean,
): RadioWallSlot[] {
  const min = Math.max(position - reach, range.min);
  const max = Math.min(position + reach, hasUnknownTrack ? count : range.max);
  const candidates: RadioWallSlot[] = [];
  for (let offset = 0; offset <= reach; offset++) {
    for (const slot of offset === 0 ? [position] : [position + offset, position - offset]) {
      if (slot < min || slot > max) continue;
      if (hasUnknownTrack && slot === count) {
        candidates.push({ position: slot, trackIndex: null });
      } else if (count > 0) {
        candidates.push({ position: slot, trackIndex: radioTrackIndex(slot, count) });
      }
    }
  }
  // Short repeat queues may wrap into the same viewport on both sides. Keep the nearest copy.
  const seen = new Set<number | null>();
  return candidates
    .filter(({ trackIndex }) => {
      if (seen.has(trackIndex)) return false;
      seen.add(trackIndex);
      return true;
    })
    .sort((left, right) => left.position - right.position);
}

export function resolveRadioWallMetrics(width: number, height: number): RadioWallMetrics {
  const cardSize = Math.min(width * 0.6, height * 0.59, 420);
  return {
    width,
    height,
    cardSize,
    centerX: width / 2,
    centerY: height * 0.46,
    radius: Math.max(width, cardSize * 3),
    step: Math.max(36, cardSize * 0.82),
  };
}

export function radioCardPose(offset: number, metrics: RadioWallMetrics) {
  const distance = Math.min(5, Math.abs(offset));
  const first = Math.min(1, distance);
  const rest = distance - first;
  const angle = (first * metrics.step + rest * metrics.cardSize * 0.48) / metrics.radius;
  return {
    x: metrics.centerX + Math.sign(offset) * metrics.radius * Math.sin(angle),
    y: metrics.centerY + metrics.radius * (1 - Math.cos(angle)) + first * metrics.cardSize * 0.12,
    rotation: Math.sign(offset) * distance * 6,
    scale: Math.max(0.26, 1 - first * 0.36 - rest * 0.1),
  };
}
