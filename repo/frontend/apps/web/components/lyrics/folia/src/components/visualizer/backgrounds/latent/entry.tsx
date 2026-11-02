import {
  FoliaQuickChip,
  FoliaQuickToggle,
} from "@scopify/ui/scopify/components/folia-panel/controls";
import { getSteppedMode } from "@scopify/ui/scopify/components/folia-panel/mode-stepper-row";
import type { LatentBackgroundColorSource } from "../../../../types";
import type { TranslationKey } from "@/lib/i18n";
import React, { lazy } from "react";
import { Layers } from "lucide-react";
import {
  DEFAULT_LATENT_BACKGROUND_TUNING,
  type LatentBackgroundDisplayMode,
} from "../../../../types";
import LatentBackgroundSettingsCard from "./LatentBackgroundSettingsCard";
import { defineVisualizerBackground } from "../definition";

const LatentBackground = lazy(() => import("./LatentBackground"));

// src/components/visualizer/backgrounds/latent/entry.tsx
// Registers the cover-colored, audio-reactive Latent shell background.

const LATENT_DISPLAY_MODES: LatentBackgroundDisplayMode[] = ["dithering", "mesh", "both"];
const LATENT_DISPLAY_LABEL_KEYS: Record<LatentBackgroundDisplayMode, TranslationKey> = {
  dithering: "folia.options.latentDisplayDithering",
  mesh: "folia.options.latentDisplayMesh",
  both: "folia.options.latentDisplayBoth",
};
const LATENT_COLOR_SOURCES: LatentBackgroundColorSource[] = ["cover-theme", "cover-only"];
const LATENT_COLOR_SOURCE_LABEL_KEYS: Record<LatentBackgroundColorSource, TranslationKey> = {
  "cover-theme": "folia.options.latentColorSourceCoverTheme",
  "cover-only": "folia.options.latentColorSourceCoverOnly",
};

export default defineVisualizerBackground({
  mode: "latent",
  order: 35,
  labelKey: "folia.options.visualizerBackgroundModeLatent",
  labelFallback: "Latent",
  render: ({ config, theme, coverUrl, audioPower, audioBands, staticMode, paused }) => (
    <LatentBackground
      theme={theme}
      coverUrl={coverUrl}
      audioPower={audioPower}
      audioBands={audioBands}
      staticMode={staticMode}
      paused={paused}
      tuning={config?.latent?.tuning}
    />
  ),
  renderSettingsPanel: ({ config, actions, ...props }) => (
    <LatentBackgroundSettingsCard
      {...props}
      tuning={config?.latent?.tuning ?? DEFAULT_LATENT_BACKGROUND_TUNING}
      onTuningChange={actions?.latent?.onTuningChange}
    />
  ),
  renderQuickControls: ({ config, actions, t }) => {
    const tuning = config?.latent?.tuning ?? DEFAULT_LATENT_BACKGROUND_TUNING;
    const displayLabel = t(LATENT_DISPLAY_LABEL_KEYS[tuning.displayMode]);
    const colorLabel = t(LATENT_COLOR_SOURCE_LABEL_KEYS[tuning.colorSource]);

    return (
      <>
        <FoliaQuickChip
          label={displayLabel}
          title={`${t("folia.options.latentDisplayMode")}: ${displayLabel}`}
          onClick={() =>
            actions?.latent?.onTuningChange?.({
              displayMode: getSteppedMode(LATENT_DISPLAY_MODES, tuning.displayMode, 1),
            })
          }
        />
        <FoliaQuickChip
          label={colorLabel}
          title={`${t("folia.options.latentColorSource")}: ${colorLabel}`}
          onClick={() =>
            actions?.latent?.onTuningChange?.({
              colorSource: getSteppedMode(LATENT_COLOR_SOURCES, tuning.colorSource, 1),
            })
          }
        />
        <FoliaQuickToggle
          active={tuning.overlayEnabled}
          label={t("folia.options.nomandBackgroundOverlay")}
          onToggle={() =>
            actions?.latent?.onTuningChange?.({ overlayEnabled: !tuning.overlayEnabled })
          }
        >
          <Layers size={14} />
        </FoliaQuickToggle>
      </>
    );
  },
  resetSettings: (actions) => actions?.latent?.onResetTuning?.(),
});
