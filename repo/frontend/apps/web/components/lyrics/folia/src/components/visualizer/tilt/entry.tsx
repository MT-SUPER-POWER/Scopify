import { FoliaQuickChip } from "@scopify/ui/scopify/components/folia-panel/controls";
import { getSteppedMode } from "@scopify/ui/scopify/components/folia-panel/mode-stepper-row";
import type { TranslationKey } from "@/lib/i18n";
import type { TiltColorScheme, TiltTuning } from "../../../types";
import { DEFAULT_TILT_TUNING } from "../../../types";
import React, { lazy } from "react";
import { defineVisualizer } from "../definition";
import { TiltSettingsPanel } from "../settingsPanels";

const VisualizerTilt = lazy(() => import("./VisualizerTilt"));

// src/components/visualizer/tilt/entry.tsx
// Registers Tilt and its preview tuning panel.
const COLOR_SCHEMES: TiltColorScheme[] = ["default", "swap", "accentAll", "primaryAll"];
const COLOR_SCHEME_LABEL_KEYS: Record<TiltColorScheme, TranslationKey> = {
  default: "folia.options.tiltColorSchemeDefault",
  swap: "folia.options.tiltColorSchemeSwap",
  accentAll: "folia.options.tiltColorSchemeAccentAll",
  primaryAll: "folia.options.tiltColorSchemePrimaryAll",
};

export default defineVisualizer({
  mode: "tilt",
  order: 40,
  labelKey: "folia.ui.visualizerTilt",
  labelFallback: "Tilt",
  previewSeed: "tilt",
  previewStartOffset: 0,
  tuningKind: "tilt",
  render: (props) => <VisualizerTilt {...props} />,
  renderSettingsPanel: (props) => <TiltSettingsPanel {...props} />,
  renderQuickControls: (props) => {
    const { t } = props;
    const tuning = props.tiltTuning ?? DEFAULT_TILT_TUNING;
    const onTuningChange = (patch: Partial<TiltTuning>) => props.onTiltTuningChange?.(patch);

    const scheme = tuning.colorScheme ?? "default";
    const schemeLabel = t(COLOR_SCHEME_LABEL_KEYS[scheme]);
    return (
      <FoliaQuickChip
        label={schemeLabel}
        title={`${t("folia.options.tiltColorScheme")}: ${schemeLabel}`}
        onClick={() => onTuningChange({ colorScheme: getSteppedMode(COLOR_SCHEMES, scheme, 1) })}
      />
    );
  },
  resetSettings: ({ resetTiltTuning }) => {
    resetTiltTuning?.();
  },
});
