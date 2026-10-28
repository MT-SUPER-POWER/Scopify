import type { LyricVisualizerMode } from "@/types/lyrics/model";

/** The styles random mode draws from: the saved pool, or every style when it holds none we know. */
export function resolveRandomVisualizerPool(
  saved: readonly LyricVisualizerMode[],
  available: readonly LyricVisualizerMode[],
): LyricVisualizerMode[] {
  const pool = available.filter((mode) => saved.includes(mode));
  return pool.length > 0 ? pool : [...available];
}

/** Another style from the pool, never `current`; `current` itself when the pool has no other. */
export function pickRandomVisualizerMode(
  pool: readonly LyricVisualizerMode[],
  current: LyricVisualizerMode,
  random: () => number = Math.random,
): LyricVisualizerMode {
  const candidates = pool.filter((mode) => mode !== current);
  return candidates.length > 0 ? candidates[Math.floor(random() * candidates.length)] : current;
}
