import { lazy } from "react";

import { DEFAULT_PENDOLO_TUNING } from "@/components/lyrics/folia/src/types";
import { defineVisualizer } from "@/components/lyrics/folia/src/components/visualizer/definition";
import PendoloSettingsPanel from "@/components/lyrics/folia/src/components/visualizer/pendolo/PendoloSettingsPanel";

const VisualizerPendolo = lazy(
  () => import("@/components/lyrics/folia/src/components/visualizer/pendolo/VisualizerPendolo"),
);

// src/components/visualizer/pendolo/entry.tsx

export default defineVisualizer({
  mode: "pendolo",
  order: 48,
  labelKey: "folia.ui.visualizerPendolo",
  labelFallback: "Pendolo",
  previewSeed: "pendolo",
  previewStartOffset: 0,
  tuningKind: "pendolo",
  render: (props) => <VisualizerPendolo {...props} />,
  renderSettingsPanel: (props) => <PendoloSettingsPanel {...props} />,
  resetSettings: ({ resetPendoloTuning, setDraftPendoloTuning }) => {
    setDraftPendoloTuning?.(DEFAULT_PENDOLO_TUNING);
    resetPendoloTuning?.();
  },
});
