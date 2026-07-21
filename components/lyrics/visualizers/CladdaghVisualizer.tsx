import type { LyricVisualizerFrame } from "@/types/lyrics";

import { LyricVisualizerScene } from "./LyricVisualizerScene";

export function CladdaghVisualizer({ frame }: { frame: LyricVisualizerFrame }) {
  return <LyricVisualizerScene frame={frame} mode="claddagh" />;
}
