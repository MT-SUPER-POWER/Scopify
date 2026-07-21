import type { LyricVisualizerFrame } from "@/types/lyrics";

import { LyricVisualizerScene } from "./LyricVisualizerScene";

export function CadenzaVisualizer({ frame }: { frame: LyricVisualizerFrame }) {
  return <LyricVisualizerScene frame={frame} mode="cadenza" />;
}
