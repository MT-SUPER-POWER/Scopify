import type { LyricVisualizerFrame } from "@/types/lyrics";

import { LyricVisualizerScene } from "./LyricVisualizerScene";

export function PartitaVisualizer({ frame }: { frame: LyricVisualizerFrame }) {
  return <LyricVisualizerScene frame={frame} mode="partita" />;
}
