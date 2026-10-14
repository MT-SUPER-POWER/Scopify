import React, { lazy } from "react";
import { Square } from "lucide-react";
import { DEFAULT_SORA_BACKGROUND_TUNING } from "../../../../types";
import SoraBackgroundSettingsCard from "./SoraBackgroundSettingsCard";
import { defineVisualizerBackground } from "../definition";
import { QuickControlToggle } from "../../../shared/QuickControlChip";

const SoraBackground = lazy(() => import("./SoraBackground"));

// src/components/visualizer/backgrounds/sora/entry.tsx
// Registers the shader-based starfield background.

export default defineVisualizerBackground({
  mode: "sora",
  order: 50,
  labelKey: "folia.options.visualizerBackgroundModeSora",
  labelFallback: "Sora",
  // Blank mode never mounts the WebGL canvas: just a static black (night) / white (daylight) frame.
  render: ({ audioPower, config, theme, isDaylight, paused }) => (
    <div
      className="absolute inset-0 z-0"
      style={{ backgroundColor: isDaylight ? "#ffffff" : "#000000" }}
    >
      {!config?.sora?.tuning?.blank && (
        <SoraBackground
          theme={theme}
          isDaylight={isDaylight}
          paused={paused}
          audioPower={audioPower}
          tuning={config?.sora?.tuning}
        />
      )}
    </div>
  ),
  renderSettingsPanel: ({ config, actions, t, ...props }) => (
    <SoraBackgroundSettingsCard
      {...props}
      t={t}
      tuning={config?.sora?.tuning ?? DEFAULT_SORA_BACKGROUND_TUNING}
      onTuningChange={actions?.sora?.onTuningChange}
    />
  ),
  renderQuickControls: ({ config, actions, t, theme }) => {
    const tuning = config?.sora?.tuning ?? DEFAULT_SORA_BACKGROUND_TUNING;
    return (
      <QuickControlToggle
        active={Boolean(tuning.blank)}
        theme={theme}
        label={t("options.soraBlank")}
        onToggle={() => actions?.sora?.onTuningChange?.({ blank: !tuning.blank })}
      >
        <Square size={14} />
      </QuickControlToggle>
    );
  },
  resetSettings: (actions) => actions?.sora?.onResetTuning?.(),
});
