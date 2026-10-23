import { SeparatorVertical } from "lucide-react";
import { FoliaQuickToggle } from "@scopify/ui/scopify/components/folia-panel/controls";
import type { CladdaghTuning } from "../../../types";
import React, { lazy } from "react";
import { DEFAULT_CLADDAGH_TUNING } from "../../../types";
import { defineVisualizer } from "../definition";
import { CladdaghSettingsPanel } from "../settingsPanels";

const VisualizerCladdagh = lazy(() => import("./VisualizerCladdagh"));

// src/components/visualizer/claddagh/entry.tsx

export default defineVisualizer({
  mode: "claddagh",
  order: 45,
  labelKey: "folia.ui.visualizerCladdagh",
  labelFallback: "Claddagh",
  previewSeed: "claddagh",
  previewStartOffset: 0,
  tuningKind: "claddagh",
  render: (props) => <VisualizerCladdagh {...props} />,
  renderSettingsPanel: (props) => <CladdaghSettingsPanel {...props} />,
  renderQuickControls: (props) => {
    const { t } = props;
    const tuning = props.claddaghTuning ?? DEFAULT_CLADDAGH_TUNING;
    const onTuningChange = (patch: Partial<CladdaghTuning>) =>
      props.onCladdaghTuningChange?.(patch);
    return (
      <FoliaQuickToggle
        active={tuning.showAxisLine}
        label={t("folia.options.claddaghShowAxisLine")}
        onToggle={() => onTuningChange({ showAxisLine: !tuning.showAxisLine })}
      >
        <SeparatorVertical size={14} />
      </FoliaQuickToggle>
    );
  },
  resetSettings: ({ resetCladdaghTuning, setDraftCladdaghTuning }) => {
    setDraftCladdaghTuning?.(DEFAULT_CLADDAGH_TUNING);
    resetCladdaghTuning?.();
  },
});
