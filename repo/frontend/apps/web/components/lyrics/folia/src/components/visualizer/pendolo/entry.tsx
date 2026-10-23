import { Disc3 } from "lucide-react";
import {
  FoliaQuickChip,
  FoliaQuickToggle,
} from "@scopify/ui/scopify/components/folia-panel/controls";
import { getSteppedMode } from "@scopify/ui/scopify/components/folia-panel/mode-stepper-row";
import type { TranslationKey } from "@/lib/i18n";
import type { PendoloTuning } from "../../../types";
import { lazy } from "react";

import { DEFAULT_PENDOLO_TUNING } from "@/components/lyrics/folia/src/types";
import { defineVisualizer } from "@/components/lyrics/folia/src/components/visualizer/definition";
import PendoloSettingsPanel from "@/components/lyrics/folia/src/components/visualizer/pendolo/PendoloSettingsPanel";

const VisualizerPendolo = lazy(
  () => import("@/components/lyrics/folia/src/components/visualizer/pendolo/VisualizerPendolo"),
);

// src/components/visualizer/pendolo/entry.tsx

const GEAR_DECOR_MODES: PendoloTuning["showGearDecor"][] = ["none", "subtle", "full"];
const GEAR_DECOR_LABEL_KEYS: Record<PendoloTuning["showGearDecor"], TranslationKey> = {
  none: "folia.options.decorNone",
  subtle: "folia.options.decorSubtle",
  full: "folia.options.decorFull",
};

export default defineVisualizer({
  mode: "pendolo",
  order: 48,
  labelKey: "folia.ui.visualizerPendolo",
  labelFallback: "Pendolo",
  previewSeed: "pendolo",
  previewStartOffset: 0,
  tuningKind: "pendolo",
  render: (props) => <VisualizerPendolo {...props} />,
  renderSettingsPanel: (props) => <PendoloSettingsPanel {...props} />,
  renderQuickControls: (props) => {
    const { t } = props;
    const tuning = props.pendoloTuning ?? DEFAULT_PENDOLO_TUNING;
    const onTuningChange = (patch: Partial<PendoloTuning>) => props.onPendoloTuningChange?.(patch);

    const showCover = tuning.showCoverOnWatchFace ?? false;
    const gearLabel = t(GEAR_DECOR_LABEL_KEYS[tuning.showGearDecor]);
    return (
      <>
        <FoliaQuickToggle
          active={showCover}
          label={t("folia.options.pendoloShowCoverOnWatchFace")}
          onToggle={() => onTuningChange({ showCoverOnWatchFace: !showCover })}
        >
          <Disc3 size={14} />
        </FoliaQuickToggle>
        <FoliaQuickChip
          label={gearLabel}
          title={`${t("folia.options.pendoloShowGearDecor")}: ${gearLabel}`}
          onClick={() =>
            onTuningChange({
              showGearDecor: getSteppedMode(GEAR_DECOR_MODES, tuning.showGearDecor, 1),
            })
          }
        />
      </>
    );
  },
  resetSettings: ({ resetPendoloTuning, setDraftPendoloTuning }) => {
    setDraftPendoloTuning?.(DEFAULT_PENDOLO_TUNING);
    resetPendoloTuning?.();
  },
});
