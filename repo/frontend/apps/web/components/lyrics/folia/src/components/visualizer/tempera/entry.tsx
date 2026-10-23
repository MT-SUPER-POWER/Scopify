import { Scan, WandSparkles } from "lucide-react";
import {
  FoliaQuickChip,
  FoliaQuickToggle,
} from "@scopify/ui/scopify/components/folia-panel/controls";
import { getSteppedMode } from "@scopify/ui/scopify/components/folia-panel/mode-stepper-row";
import type { TranslationKey } from "@/lib/i18n";
import type { TemperaColorMode, TemperaTuning } from "../../../types";
import React from "react";
import { DEFAULT_TEMPERA_TUNING } from "../../../types";
import { defineVisualizer } from "../definition";
import TemperaSettingsPanel from "./TemperaSettingsPanel";

const VisualizerTempera = React.lazy(() => import("./VisualizerTempera"));

// src/components/visualizer/tempera/entry.tsx
// Registers 凝彩, the deterministic block-composition lyric-PV director.
const COLOR_MODES: TemperaColorMode[] = ["duo", "mono", "gradient"];
const COLOR_MODE_LABEL_KEYS: Record<TemperaColorMode, TranslationKey> = {
  duo: "folia.options.temperaColorModeDuo",
  mono: "folia.options.temperaColorModeMono",
  gradient: "folia.options.temperaColorModeGradient",
};

export default defineVisualizer({
  mode: "tempera",
  order: 20,
  labelKey: "folia.ui.visualizerTempera",
  labelFallback: "Tempera",
  previewSeed: "tempera",
  previewStartOffset: 0,
  tuningKind: "tempera",
  // Deliberately unkeyed on the seed: the runtime hands a track change over in place
  // (see songHandover.ts / pixiRuntimeHost.ts). Remounting here would throw the WebGL
  // context away mid-transition and leave the frame empty for the whole rebuild.
  render: (props) => <VisualizerTempera {...props} />,
  renderSettingsPanel: (props) => <TemperaSettingsPanel {...props} />,
  renderQuickControls: (props) => {
    const { t } = props;
    const tuning = props.temperaTuning ?? DEFAULT_TEMPERA_TUNING;
    const onTuningChange = (patch: Partial<TemperaTuning>) => props.onTemperaTuningChange?.(patch);

    const colorLabel = t(COLOR_MODE_LABEL_KEYS[tuning.colorMode]);
    return (
      <>
        <FoliaQuickChip
          label={colorLabel}
          title={`${t("folia.options.temperaColorMode")}: ${colorLabel}`}
          onClick={() =>
            onTuningChange({ colorMode: getSteppedMode(COLOR_MODES, tuning.colorMode, 1) })
          }
        />
        <FoliaQuickToggle
          active={tuning.postProcessEnabled}
          label={t("folia.options.temperaPostProcessEnabled")}
          onToggle={() => onTuningChange({ postProcessEnabled: !tuning.postProcessEnabled })}
        >
          <WandSparkles size={14} />
        </FoliaQuickToggle>
        <FoliaQuickToggle
          active={tuning.showCornerMarks}
          label={t("folia.options.temperaShowCornerMarks")}
          onToggle={() => onTuningChange({ showCornerMarks: !tuning.showCornerMarks })}
        >
          <Scan size={14} />
        </FoliaQuickToggle>
      </>
    );
  },
  resetSettings: ({ resetTemperaTuning, setDraftTemperaTuning }) => {
    setDraftTemperaTuning?.(DEFAULT_TEMPERA_TUNING);
    resetTemperaTuning?.();
  },
});
