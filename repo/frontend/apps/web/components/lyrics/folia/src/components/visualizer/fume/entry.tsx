import { EyeOff } from "lucide-react";
import {
  FoliaQuickChip,
  FoliaQuickToggle,
} from "@scopify/ui/scopify/components/folia-panel/controls";
import { getSteppedMode } from "@scopify/ui/scopify/components/folia-panel/mode-stepper-row";
import type { TranslationKey } from "@/lib/i18n";
import type { FumeTuning } from "../../../types";
import React, { lazy } from "react";
import { DEFAULT_FUME_TUNING } from "../../../types";
import { defineVisualizer } from "../definition";
import { FumeSettingsPanel } from "../settingsPanels";

const VisualizerFume = lazy(() => import("./VisualizerFume"));

// src/components/visualizer/fume/entry.tsx
// Registers Fume and its preview tuning panel.
const CAMERA_TRACKING_MODES: FumeTuning["cameraTrackingMode"][] = ["stepped", "smooth"];
const CAMERA_TRACKING_LABEL_KEYS: Record<FumeTuning["cameraTrackingMode"], TranslationKey> = {
  stepped: "folia.options.fumeCameraTrackingStepped",
  smooth: "folia.options.fumeCameraTrackingSmooth",
};

export default defineVisualizer({
  mode: "fume",
  order: 40,
  labelKey: "folia.ui.visualizerFume",
  labelFallback: "Fume",
  previewSeed: "fume",
  previewStartOffset: 18.4,
  tuningKind: "fume",
  render: (props) => <VisualizerFume {...props} />,
  renderSettingsPanel: (props) => <FumeSettingsPanel {...props} />,
  renderQuickControls: (props) => {
    const { t } = props;
    const tuning = props.fumeTuning ?? DEFAULT_FUME_TUNING;
    const onTuningChange = (patch: Partial<FumeTuning>) => props.onFumeTuningChange?.(patch);

    const trackingLabel = t(CAMERA_TRACKING_LABEL_KEYS[tuning.cameraTrackingMode]);
    return (
      <>
        <FoliaQuickToggle
          active={tuning.hidePrintSymbols}
          label={t("folia.options.fumeHidePrintSymbols")}
          onToggle={() => onTuningChange({ hidePrintSymbols: !tuning.hidePrintSymbols })}
        >
          <EyeOff size={14} />
        </FoliaQuickToggle>
        <FoliaQuickChip
          label={trackingLabel}
          title={`${t("folia.options.fumeCameraTrackingMode")}: ${trackingLabel}`}
          onClick={() =>
            onTuningChange({
              cameraTrackingMode: getSteppedMode(
                CAMERA_TRACKING_MODES,
                tuning.cameraTrackingMode,
                1,
              ),
            })
          }
        />
      </>
    );
  },
  resetSettings: ({ resetFumeTuning, setDraftFumeTuning }) => {
    setDraftFumeTuning?.(DEFAULT_FUME_TUNING);
    resetFumeTuning?.();
  },
});
