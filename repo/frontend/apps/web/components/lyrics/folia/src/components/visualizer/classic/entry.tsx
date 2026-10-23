import { RotateCw } from "lucide-react";
import { FoliaQuickToggle } from "@scopify/ui/scopify/components/folia-panel/controls";
import type { ClassicTuning } from "../../../types";
import { DEFAULT_CLASSIC_TUNING } from "../../../types";
import React, { lazy } from "react";
import { defineVisualizer } from "../definition";
import { ClassicSettingsPanel } from "../settingsPanels";

const Visualizer = lazy(() => import("./Visualizer"));

// src/components/visualizer/classic/entry.tsx
// Registers the classic visualizer mode.
export default defineVisualizer({
  mode: "classic",
  order: 10,
  labelKey: "folia.ui.visualizerClassic",
  labelFallback: "Luminous",
  previewSeed: "classic",
  previewStartOffset: 0,
  tuningKind: "classic",
  render: (props) => <Visualizer {...props} />,
  renderSettingsPanel: (props) => <ClassicSettingsPanel {...props} />,
  renderQuickControls: (props) => {
    const { t } = props;
    const tuning = props.classicTuning ?? DEFAULT_CLASSIC_TUNING;
    const onTuningChange = (patch: Partial<ClassicTuning>) => props.onClassicTuningChange?.(patch);
    return (
      <FoliaQuickToggle
        active={tuning.enableWordRotation}
        label={t("folia.options.classicWordRotation")}
        onToggle={() => onTuningChange({ enableWordRotation: !tuning.enableWordRotation })}
      >
        <RotateCw size={14} />
      </FoliaQuickToggle>
    );
  },
  resetSettings: ({ resetClassicTuning }) => {
    resetClassicTuning?.();
  },
});
