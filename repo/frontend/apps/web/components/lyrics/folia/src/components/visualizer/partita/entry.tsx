import { Spline } from "lucide-react";
import { FoliaQuickToggle } from "@scopify/ui/scopify/components/folia-panel/controls";
import type { PartitaTuning } from "../../../types";
import { DEFAULT_PARTITA_TUNING } from "../../../types";
import React, { lazy } from "react";
import { defineVisualizer } from "../definition";
import { PartitaSettingsPanel } from "../settingsPanels";

const VisualizerPartita = lazy(() => import("./VisualizerPartita"));

// src/components/visualizer/partita/entry.tsx
// Registers Partita and its preview tuning panel.
export default defineVisualizer({
  mode: "partita",
  order: 30,
  labelKey: "folia.ui.visualizerPartita",
  labelFallback: "云阶",
  previewSeed: "partita",
  previewStartOffset: 0,
  tuningKind: "partita",
  render: (props) => <VisualizerPartita {...props} />,
  renderSettingsPanel: (props) => <PartitaSettingsPanel {...props} />,
  renderQuickControls: (props) => {
    const { t } = props;
    const tuning = props.partitaTuning ?? DEFAULT_PARTITA_TUNING;
    const onTuningChange = (patch: Partial<PartitaTuning>) => props.onPartitaTuningChange?.(patch);
    return (
      <FoliaQuickToggle
        active={tuning.showGuideLines}
        label={t("folia.options.partitaGuideLines")}
        onToggle={() => onTuningChange({ showGuideLines: !tuning.showGuideLines })}
      >
        <Spline size={14} />
      </FoliaQuickToggle>
    );
  },
  resetSettings: ({ resetPartitaTuning }) => {
    resetPartitaTuning?.();
  },
});
