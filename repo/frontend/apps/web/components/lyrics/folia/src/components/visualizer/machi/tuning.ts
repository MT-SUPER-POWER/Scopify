import { defineVisualizerTuning } from "../tuningRegistry";

// src/components/visualizer/machi/tuning.ts
// Injects 町景's tuning at the renderer boundary. Scopify's settings store normalizes stored values
// through machiTuning.ts (see lib/lyrics/foliaStageSettings.ts).
export default defineVisualizerTuning({
  mode: "machi",
  settingsKey: "machiTuning",
  settingsSetterKey: "handleSetMachiTuning",
  apply: (props, tuning) => ({ ...props, machiTuning: tuning }),
});
