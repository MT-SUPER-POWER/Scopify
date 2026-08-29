import React from "react";
import { DEFAULT_TEMPERA_TUNING } from "../../../types";
import { defineVisualizer } from "../definition";
import TemperaSettingsPanel from "./TemperaSettingsPanel";

const VisualizerTempera = React.lazy(() => import("./VisualizerTempera"));

// src/components/visualizer/tempera/entry.tsx
// Registers 凝彩, the deterministic block-composition lyric-PV director.
export default defineVisualizer({
  mode: "tempera",
  order: 20,
  labelKey: "folia.ui.visualizerTempera",
  labelFallback: "Tempera",
  previewSeed: "tempera",
  previewStartOffset: 0,
  tuningKind: "tempera",
  render: (props) => <VisualizerTempera key={props.seed} {...props} />,
  renderSettingsPanel: (props) => <TemperaSettingsPanel {...props} />,
  resetSettings: ({ resetTemperaTuning, setDraftTemperaTuning }) => {
    setDraftTemperaTuning?.(DEFAULT_TEMPERA_TUNING);
    resetTemperaTuning?.();
  },
});
