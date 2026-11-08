/** Estimates callback cadence, not hardware capability. Long pauses are not valid samples. */
export function estimateDisplayRefreshRate(timestamps: readonly number[]): number | null {
  const intervals = timestamps.slice(1).map((timestamp, index) => timestamp - timestamps[index]);
  if (
    intervals.length < 20 ||
    intervals.some((interval) => !Number.isFinite(interval) || interval <= 0 || interval > 100)
  ) {
    return null;
  }
  const ordered = intervals.toSorted((left, right) => left - right);
  const middle = Math.floor(ordered.length / 2);
  const median =
    ordered.length % 2 === 0 ? (ordered[middle - 1] + ordered[middle]) / 2 : ordered[middle];
  return Math.round(1000 / median);
}
