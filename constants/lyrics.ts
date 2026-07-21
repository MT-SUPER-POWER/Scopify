import type { LyricVisualizerMode } from "@/types/lyrics";

export interface LyricVisualizerOption {
  label: string;
  mode: LyricVisualizerMode;
}

/**
 * Static Next-compatible replacement for Folia's Vite `import.meta.glob`
 * discovery. The visualizer registry consumes this canonical order.
 */
export const LYRIC_VISUALIZER_OPTIONS: LyricVisualizerOption[] = [
  { label: "Classic", mode: "classic" },
  { label: "Cadenza", mode: "cadenza" },
  { label: "Partita", mode: "partita" },
  { label: "Fume", mode: "fume" },
  { label: "Claddagh", mode: "claddagh" },
  { label: "Cappella", mode: "cappella" },
  { label: "Tilt", mode: "tilt" },
  { label: "Monet", mode: "monet" },
  { label: "Diorama", mode: "diorama" },
];
