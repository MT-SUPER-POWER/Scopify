import { AlignLeft, AudioWaveform, Move } from "lucide-react";
import { FoliaQuickToggle } from "@scopify/ui/scopify/components/folia-panel/controls";
import type { MonetTuning } from "../../../types";
import React, { lazy } from "react";
import { DEFAULT_MONET_TUNING } from "../../../types";
import { defineVisualizer } from "../definition";
import { MonetSettingsPanel } from "./MonetSettingsPanel";

const VisualizerMonet = lazy(() => import("./VisualizerMonet"));

// src/components/visualizer/monet/entry.tsx
// Registers the Monet poster visualizer and its mode-owned settings panel.
export default defineVisualizer({
  mode: "monet",
  order: 45,
  labelKey: "folia.ui.visualizerMonet",
  labelFallback: "Monet",
  previewSeed: "monet",
  previewStartOffset: 0,
  tuningKind: "monet",
  render: (props) => {
    const monetTuning = props.monetTuning ?? DEFAULT_MONET_TUNING;
    const lyricsFontScale = props.lyricsFontScale ?? 1;
    return (
      <VisualizerMonet
        {...props}
        monetTuning={{
          ...monetTuning,
          fontScale: monetTuning.fontScale * lyricsFontScale,
        }}
      />
    );
  },
  renderSettingsPanel: (props) => <MonetSettingsPanel {...props} />,
  renderQuickControls: (props) => {
    const { t } = props;
    const tuning = props.monetTuning ?? DEFAULT_MONET_TUNING;
    const onTuningChange = (patch: Partial<MonetTuning>) => props.onMonetTuningChange?.(patch);

    const showHanger = tuning.showPortraitDragHanger ?? true;
    return (
      <>
        <FoliaQuickToggle
          active={tuning.showDescription}
          label={t("folia.options.monetShowDescription")}
          onToggle={() => onTuningChange({ showDescription: !tuning.showDescription })}
        >
          <AlignLeft size={14} />
        </FoliaQuickToggle>
        <FoliaQuickToggle
          active={showHanger}
          label={t("folia.options.monetPortraitDragHanger")}
          onToggle={() => onTuningChange({ showPortraitDragHanger: !showHanger })}
        >
          <Move size={14} />
        </FoliaQuickToggle>
        <FoliaQuickToggle
          active={tuning.showAudioVisualization}
          label={t("folia.options.monetShowAudioVisualization")}
          onToggle={() =>
            onTuningChange({ showAudioVisualization: !tuning.showAudioVisualization })
          }
        >
          <AudioWaveform size={14} />
        </FoliaQuickToggle>
      </>
    );
  },
  resetSettings: ({ resetMonetTuning }) => {
    resetMonetTuning?.();
  },
});
