// src/components/visualizer/textMeasureCache.ts (Folia f9b331dc)
// Two small things the modes' text measurement shares: an insertion-ordered bounded cache, and
// the loop that accumulates grapheme offsets by measuring whole prefixes.

/**
 * Stores `value` under `key` in an insertion-ordered Map, first evicting the oldest entry when a
 * new key would push the cache past `limit`. Returns `value` so callers can return it directly.
 */
export const rememberBounded = <TKey, TValue>(
  cache: Map<TKey, TValue>,
  key: TKey,
  value: TValue,
  limit: number,
): TValue => {
  if (!cache.has(key) && cache.size >= limit) {
    const oldest = cache.keys().next();
    if (!oldest.done) cache.delete(oldest.value);
  }
  cache.set(key, value);
  return value;
};

/**
 * Cumulative grapheme offsets: `offsets[i]` is the advance of the first `i` graphemes, with
 * `offsets[0] = 0`. Each prefix is measured as a whole string (not as a sum of single glyphs) so
 * kerning and shaping across glyph boundaries stay exact; `measurePrefix` also receives the count
 * and the previous offset for modes that add tracking or keep the offsets monotonic.
 */
export const measurePrefixOffsets = (
  graphemes: readonly string[],
  measurePrefix: (prefix: string, count: number, previousOffset: number) => number,
): number[] => {
  const offsets = new Array<number>(graphemes.length + 1).fill(0);
  for (let count = 1; count <= graphemes.length; count += 1) {
    offsets[count] = measurePrefix(graphemes.slice(0, count).join(""), count, offsets[count - 1]);
  }
  return offsets;
};
