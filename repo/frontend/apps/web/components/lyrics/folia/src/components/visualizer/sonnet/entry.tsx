import { WandSparkles } from "lucide-react";
import {
  FoliaQuickChip,
  FoliaQuickToggle,
} from "@scopify/ui/scopify/components/folia-panel/controls";
import { getSteppedMode } from "@scopify/ui/scopify/components/folia-panel/mode-stepper-row";
import type { TranslationKey } from "@/lib/i18n";
import type { SonnetOuterFrameMode, SonnetTuning } from "../../../types";
import React, { lazy } from "react";
import { DEFAULT_SONNET_TUNING } from "../../../types";
import { defineVisualizer } from "../definition";
import SonnetSettingsPanel from "./SonnetSettingsPanel";

const VisualizerSonnet = lazy(() => import("./VisualizerSonnet"));

// src/components/visualizer/sonnet/entry.tsx
// Registers 商籁, the deterministic Japanese MG lyric-PV director.
const OUTER_FRAME_MODES: SonnetOuterFrameMode[] = ["none", "frame", "full"];
const OUTER_FRAME_LABEL_KEYS: Record<SonnetOuterFrameMode, TranslationKey> = {
  none: "folia.options.sonnetOuterFrameNone",
  frame: "folia.options.sonnetOuterFrameFrame",
  full: "folia.options.sonnetOuterFrameFull",
};

export default defineVisualizer({
  mode: "sonnet",
  order: 70,
  labelKey: "folia.ui.visualizerSonnet",
  labelFallback: "商籁",
  previewSeed: "sonnet",
  previewStartOffset: 0,
  tuningKind: "sonnet",
  // Deliberately unkeyed on the seed: the runtime hands a track change over in place
  // (see songHandover.ts / pixiRuntimeHost.ts). Remounting here would throw the WebGL
  // context away mid-transition and leave the frame empty for the whole rebuild.
  render: (props) => <VisualizerSonnet {...props} />,
  renderSettingsPanel: (props) => <SonnetSettingsPanel {...props} />,
  renderQuickControls: (props) => {
    const { t } = props;
    const tuning = props.sonnetTuning ?? DEFAULT_SONNET_TUNING;
    const onTuningChange = (patch: Partial<SonnetTuning>) => props.onSonnetTuningChange?.(patch);

    const frameLabel = t(OUTER_FRAME_LABEL_KEYS[tuning.outerFrameMode]);
    return (
      <>
        <FoliaQuickChip
          label={frameLabel}
          title={`${t("folia.options.sonnetOuterFrameMode")}: ${frameLabel}`}
          onClick={() =>
            onTuningChange({
              outerFrameMode: getSteppedMode(OUTER_FRAME_MODES, tuning.outerFrameMode, 1),
            })
          }
        />
        <FoliaQuickToggle
          active={tuning.postProcessEnabled}
          label={t("folia.options.sonnetPostProcessEnabled")}
          onToggle={() => onTuningChange({ postProcessEnabled: !tuning.postProcessEnabled })}
        >
          <WandSparkles size={14} />
        </FoliaQuickToggle>
      </>
    );
  },
  resetSettings: ({ resetSonnetTuning, setDraftSonnetTuning }) => {
    setDraftSonnetTuning?.(DEFAULT_SONNET_TUNING);
    resetSonnetTuning?.();
  },
});
