import { defineVisualizerTuning } from "../tuningRegistry";

export default defineVisualizerTuning({
  mode: "metaphor",
  settingsKey: "metaphorTuning",
  settingsSetterKey: "handleSetMetaphorTuning",
  apply: (props, tuning) => ({ ...props, metaphorTuning: tuning }),
});
