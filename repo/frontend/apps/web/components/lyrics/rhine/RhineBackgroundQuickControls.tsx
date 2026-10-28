"use client";

import { AudioLines, Wind } from "lucide-react";
import {
  FoliaQuickChip,
  FoliaQuickToggle,
} from "@scopify/ui/scopify/components/folia-panel/controls";
import { getSteppedMode } from "@scopify/ui/scopify/components/folia-panel/mode-stepper-row";
import { DEFAULT_RHINE_BACKGROUND_TUNING } from "@/constants/rhineBackground";
import type { VisualizerBackgroundQuickControlsProps } from "@/components/lyrics/folia/src/components/visualizer/backgrounds/definition";
import type { RhineBackgroundTuning } from "@/types/lyrics/rhine/background";

const COLOR_MODES = ["auto", "light", "dark"] as const;
const RHYTHM_STYLES = ["legacy", "wave", "lift", "beat"] as const;
const COLOR_LABELS = {
  auto: "folia.rhine.colorAuto",
  light: "folia.rhine.colorLight",
  dark: "folia.rhine.colorDark",
} as const;
const RHYTHM_LABELS = {
  legacy: "folia.rhine.rhythmLegacy",
  wave: "folia.rhine.rhythmWave",
  lift: "folia.rhine.rhythmLift",
  beat: "folia.rhine.rhythmBeat",
} as const;

/** The same persisted tuning as the full Rhine editor, exposed through the background toolbar. */
export function RhineBackgroundQuickControls({
  config,
  actions,
  t,
}: VisualizerBackgroundQuickControlsProps) {
  const tuning = { ...DEFAULT_RHINE_BACKGROUND_TUNING, ...config?.rhine?.tuning };
  const change = (patch: Partial<RhineBackgroundTuning>) => actions?.rhine?.onTuningChange?.(patch);
  const colorLabel = t(COLOR_LABELS[tuning.colorMode]);
  const rhythmLabel = t(RHYTHM_LABELS[tuning.rhythmStyle]);

  return (
    <>
      <FoliaQuickChip
        label={colorLabel}
        title={`${t("folia.rhine.colorMode")}: ${colorLabel}`}
        onClick={() => change({ colorMode: getSteppedMode(COLOR_MODES, tuning.colorMode, 1) })}
      />
      <FoliaQuickChip
        label={rhythmLabel}
        title={`${t("folia.rhine.rhythmStyle")}: ${rhythmLabel}`}
        onClick={() =>
          change({ rhythmStyle: getSteppedMode(RHYTHM_STYLES, tuning.rhythmStyle, 1) })
        }
      />
      <FoliaQuickToggle
        active={tuning.musicEnabled}
        label={t("folia.rhine.musicEnabled")}
        onToggle={() => change({ musicEnabled: !tuning.musicEnabled })}
      >
        <AudioLines size={14} />
      </FoliaQuickToggle>
      <FoliaQuickToggle
        active={tuning.breathingEnabled}
        label={t("folia.rhine.breathingEnabled")}
        onToggle={() => change({ breathingEnabled: !tuning.breathingEnabled })}
      >
        <Wind size={14} />
      </FoliaQuickToggle>
    </>
  );
}
