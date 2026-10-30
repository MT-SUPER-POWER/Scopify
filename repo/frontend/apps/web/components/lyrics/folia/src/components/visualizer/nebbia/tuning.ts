import { defineVisualizerTuning } from "../tuningRegistry";

// src/components/visualizer/nebbia/tuning.ts
// Injects 雾笺's tuning at the renderer boundary. Scopify's settings store normalizes stored values
// through nebbiaTuning.ts (see lib/lyrics/foliaStageSettings.ts).
export default defineVisualizerTuning({
  mode: "nebbia",
  settingsKey: "nebbiaTuning",
  settingsSetterKey: "handleSetNebbiaTuning",
  apply: (props, tuning) => ({ ...props, nebbiaTuning: tuning }),
});
