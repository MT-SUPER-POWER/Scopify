import React, { lazy } from "react";
import { defineVisualizer } from "../definition";
import { CappellaSettingsPanel } from "../settingsPanels";

const VisualizerCappella = lazy(() => import("./VisualizerCappella"));

// src/components/visualizer/cappella/entry.tsx
// Registers the Cappella chat visualizer mode.
export default defineVisualizer({
  mode: "cappella",
  order: 50,
  labelKey: "folia.ui.visualizerCappella",
  labelFallback: "Cappella",
  previewSeed: "cappella",
  previewStartOffset: 0,
  tuningKind: "cappella",
  render: (props) => <VisualizerCappella {...props} />,
  renderSettingsPanel: (props) => <CappellaSettingsPanel {...props} />,
  resetSettings: (props) => {
    props.resetCappellaTuning?.();
  },
});
