import type { ComponentType } from "react";

import type { LyricVisualizerFrame, LyricVisualizerMode } from "@/types/lyrics";

import { CadenzaVisualizer } from "./CadenzaVisualizer";
import { CappellaVisualizer } from "./CappellaVisualizer";
import { CladdaghVisualizer } from "./CladdaghVisualizer";
import { ClassicVisualizer } from "./ClassicVisualizer";
import { DioramaVisualizer } from "./DioramaVisualizer";
import { FumeVisualizer } from "./FumeVisualizer";
import { MonetVisualizer } from "./MonetVisualizer";
import { PartitaVisualizer } from "./PartitaVisualizer";
import { TiltVisualizer } from "./TiltVisualizer";

type LyricVisualizerComponent = ComponentType<{ frame: LyricVisualizerFrame }>;

/** Explicit static registry required by Next; Folia uses `import.meta.glob`. */
export const lyricVisualizerRegistry: Record<LyricVisualizerMode, LyricVisualizerComponent> = {
  cadenza: CadenzaVisualizer,
  cappella: CappellaVisualizer,
  claddagh: CladdaghVisualizer,
  classic: ClassicVisualizer,
  diorama: DioramaVisualizer,
  fume: FumeVisualizer,
  monet: MonetVisualizer,
  partita: PartitaVisualizer,
  tilt: TiltVisualizer,
};
