import React from "react";
import { Contrast, Scissors } from "lucide-react";
import { FoliaQuickToggle } from "@scopify/ui/scopify/components/folia-panel/controls";
import { DEFAULT_METAPHOR_TUNING } from "@/lib/lyrics/metaphorTuning";
import { defineVisualizer } from "../definition";
import MetaphorSettingsPanel from "./MetaphorSettingsPanel";

const VisualizerMetaphor = React.lazy(() => import("./VisualizerMetaphor"));

export default defineVisualizer({
  mode: "metaphor",
  order: 29.5,
  labelKey: "folia.ui.visualizerMetaphor",
  labelFallback: "隐喻",
  previewSeed: "metaphor",
  previewStartOffset: 0,
  tuningKind: "metaphor",
  // The runtime handles track changes in place.
  render: (props) => (
    <VisualizerMetaphor
      {...props}
      metaphorTuning={props.metaphorTuning ?? DEFAULT_METAPHOR_TUNING}
    />
  ),
  renderSettingsPanel: (props) => <MetaphorSettingsPanel {...props} />,
  renderQuickControls: ({
    metaphorTuning = DEFAULT_METAPHOR_TUNING,
    onMetaphorTuningChange,
    t,
  }) => {
    if (!onMetaphorTuningChange) return null;
    return (
      <>
        <FoliaQuickToggle
          active={metaphorTuning.flip}
          label={t("folia.options.metaphorFlip")}
          onToggle={() => onMetaphorTuningChange({ flip: !metaphorTuning.flip })}
        >
          <Contrast size={14} />
        </FoliaQuickToggle>
        <FoliaQuickToggle
          active={metaphorTuning.transitions}
          label={t("folia.options.metaphorTransitions")}
          onToggle={() => onMetaphorTuningChange({ transitions: !metaphorTuning.transitions })}
        >
          <Scissors size={14} />
        </FoliaQuickToggle>
      </>
    );
  },
});
