import type { LyricVisualizerFrame } from "@/types/lyrics";

import { LyricVisualizerScene } from "./LyricVisualizerScene";

export function ClassicVisualizer({ frame }: { frame: LyricVisualizerFrame }) {
  return <LyricVisualizerScene frame={frame} mode="classic" />;
}
