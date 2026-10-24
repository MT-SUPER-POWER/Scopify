import { defineVisualizerTuning } from "../tuningRegistry";

// src/components/visualizer/hanabi/tuning.ts
// Injects 花火's strongly typed tuning at the renderer boundary. Scopify's settings store clamps
// stored values through lib/lyrics/foliaStageSettings.ts; the renderer still runs
// normalizeHanabiTuning so a partial or older tuning never reaches the scene.
export default defineVisualizerTuning({
  mode: "hanabi",
  settingsKey: "hanabiTuning",
  settingsSetterKey: "handleSetHanabiTuning",
  apply: (props, tuning) => ({ ...props, hanabiTuning: tuning }),
});
