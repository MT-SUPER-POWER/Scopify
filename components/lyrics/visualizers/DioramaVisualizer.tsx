import type { LyricVisualizerFrame } from "@/types/lyrics";

import { LyricVisualizerScene } from "./LyricVisualizerScene";

export function DioramaVisualizer({ frame }: { frame: LyricVisualizerFrame }) {
  return <LyricVisualizerScene frame={frame} mode="diorama" />;
}
