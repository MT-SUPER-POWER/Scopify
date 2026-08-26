import React, { lazy } from "react";
import { DEFAULT_SORA_BACKGROUND_TUNING } from "../../../../types";
import SoraBackgroundSettingsCard from "./SoraBackgroundSettingsCard";
import { defineVisualizerBackground } from "../definition";

const SoraBackground = lazy(() => import("./SoraBackground"));

// src/components/visualizer/backgrounds/sora/entry.tsx
// Registers the shader-based starfield background.

export default defineVisualizerBackground({
  mode: "sora",
  order: 50,
  labelKey: "folia.options.visualizerBackgroundModeSora",
  labelFallback: "Sora",
  render: ({ audioPower, config, theme, isDaylight, paused }) => (
    <div className="absolute inset-0 z-0">
      <SoraBackground
        theme={theme}
        isDaylight={isDaylight}
        paused={paused}
        audioPower={audioPower}
        tuning={config?.sora?.tuning}
      />
    </div>
  ),
  renderSettingsPanel: ({ config, actions, ...props }) => (
    <SoraBackgroundSettingsCard
      {...props}
      tuning={config?.sora?.tuning ?? DEFAULT_SORA_BACKGROUND_TUNING}
      onTuningChange={actions?.sora?.onTuningChange}
    />
  ),
  resetSettings: (actions) => actions?.sora?.onResetTuning?.(),
});
