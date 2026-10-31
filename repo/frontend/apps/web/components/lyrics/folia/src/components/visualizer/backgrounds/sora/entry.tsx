import { FoliaQuickToggle } from "@scopify/ui/scopify/components/folia-panel/controls";
import React, { lazy } from "react";
import { Aperture, Square } from "lucide-react";
import { DEFAULT_SORA_BACKGROUND_TUNING } from "../../../../types";
import SoraBackgroundSettingsCard from "./SoraBackgroundSettingsCard";
import { defineVisualizerBackground } from "../definition";
import VignetteOverlay from "../VignetteOverlay";

const SoraBackground = lazy(() => import("./SoraBackground"));

const DEFAULT_VIGNETTE_SPREAD = DEFAULT_SORA_BACKGROUND_TUNING.vignetteSpread ?? 35;

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
      <VignetteOverlay
        disabled={config?.common?.disableVignette ?? false}
        clearStop={100 - (config?.sora?.tuning?.vignetteSpread ?? DEFAULT_VIGNETTE_SPREAD)}
      />
    </div>
  ),
  renderSettingsPanel: ({ config, actions, t, ...props }) => (
    <SoraBackgroundSettingsCard
      {...props}
      t={t}
      tuning={config?.sora?.tuning ?? DEFAULT_SORA_BACKGROUND_TUNING}
      onTuningChange={actions?.sora?.onTuningChange}
      vignetteDisabled={config?.common?.disableVignette ?? false}
      onVignetteDisabledChange={actions?.common?.onDisableVignetteChange}
    />
  ),
  renderQuickControls: ({ config, actions, t }) => {
    const tuning = config?.sora?.tuning ?? DEFAULT_SORA_BACKGROUND_TUNING;
    // The vignette is stored as its opposite (disableVignette): the switch is lit while it is drawn.
    const vignette = !(config?.common?.disableVignette ?? false);
    return (
      <>
        <FoliaQuickToggle
          active={Boolean(tuning.blank)}
          label={t("folia.options.soraBlank")}
          onToggle={() => actions?.sora?.onTuningChange?.({ blank: !tuning.blank })}
        >
          <Square size={14} />
        </FoliaQuickToggle>
        <FoliaQuickToggle
          active={vignette}
          label={t("folia.options.sonnetPostProcessVignette")}
          onToggle={() => actions?.common?.onDisableVignetteChange?.(vignette)}
        >
          <Aperture size={14} />
        </FoliaQuickToggle>
      </>
    );
  },
  resetSettings: (actions) => actions?.sora?.onResetTuning?.(),
});
