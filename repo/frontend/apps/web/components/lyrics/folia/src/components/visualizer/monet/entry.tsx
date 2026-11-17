import { resolveMonetChromeVisibility } from "@/lib/lyrics/folia/monetAppearance";
import { AlignLeft, AudioWaveform, Move } from "lucide-react";
import { FoliaQuickToggle } from "@scopify/ui/scopify/components/folia-panel/controls";
import type { MonetTuning } from "../../../types";
import React, { lazy } from "react";
import { DEFAULT_MONET_TUNING } from "../../../types";
import { defineVisualizer } from "../definition";
import { MonetSettingsPanel } from "./MonetSettingsPanel";
import { MONET_CHROME_VISIBILITY_KEYS, nextMonetChromeVisibility } from "./tuning";

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

    const description = resolveMonetChromeVisibility(
      tuning.descriptionVisibility,
      tuning.showDescription,
    );
    const hanger = resolveMonetChromeVisibility(
      tuning.portraitHangerVisibility,
      tuning.showPortraitDragHanger,
    );
    return (
      <>
        <FoliaQuickToggle
          active={description !== "hidden"}
          label={`${t("folia.options.monetShowDescription")} (${t(MONET_CHROME_VISIBILITY_KEYS[description])})`}
          onToggle={() => {
            const descriptionVisibility = nextMonetChromeVisibility(description);
            onTuningChange({
              descriptionVisibility,
              showDescription: descriptionVisibility !== "hidden",
            });
          }}
        >
          <AlignLeft size={14} />
        </FoliaQuickToggle>
        <FoliaQuickToggle
          active={hanger !== "hidden"}
          label={`${t("folia.options.monetPortraitDragHanger")} (${t(MONET_CHROME_VISIBILITY_KEYS[hanger])})`}
          onToggle={() => {
            const portraitHangerVisibility = nextMonetChromeVisibility(hanger);
            onTuningChange({
              portraitHangerVisibility,
              showPortraitDragHanger: portraitHangerVisibility !== "hidden",
            });
          }}
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
