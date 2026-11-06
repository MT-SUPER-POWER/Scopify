import { defineVisualizerTuning } from "../tuningRegistry";

// Injects 聚散's tuning at the renderer boundary. Scopify's settings store normalizes stored values through
// lib/lyrics/prisma/tuning.ts.
export default defineVisualizerTuning({
  mode: "prisma",
  settingsKey: "prismaTuning",
  settingsSetterKey: "handleSetPrismaTuning",
  apply: (props, tuning) => ({ ...props, prismaTuning: tuning }),
});
