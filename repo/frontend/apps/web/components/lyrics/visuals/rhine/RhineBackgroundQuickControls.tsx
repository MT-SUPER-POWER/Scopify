"use client";

import { FoliaQuickChip, FoliaSegments } from "@scopify/ui/scopify/components/folia-panel/controls";
import { getSteppedMode } from "@scopify/ui/scopify/components/folia-panel/mode-stepper-row";
import { DEFAULT_RHINE_BACKGROUND_TUNING, RHINE_RHYTHM_STYLES } from "@/constants/rhineBackground";
import type { VisualizerBackgroundQuickControlsProps } from "@/components/lyrics/folia/src/components/visualizer/backgrounds/definition";
import type { RhineBackgroundTuning } from "@/types/lyrics/rhine/background";

const COLOR_MODES = ["auto", "light", "dark"] as const;
const COLOR_LABELS = {
  auto: "folia.rhine.colorAuto",
  light: "folia.rhine.colorLight",
  dark: "folia.rhine.colorDark",
} as const;
export const RHINE_RHYTHM_LABELS = {
  still: { label: "folia.rhine.rhythmStill", tip: "folia.rhine.rhythmStillHint" },
  breath: { label: "folia.rhine.rhythmBreath", tip: "folia.rhine.rhythmBreathHint" },
  legacy: { label: "folia.rhine.rhythmLegacy", tip: "folia.rhine.rhythmLegacyHint" },
  wave: { label: "folia.rhine.rhythmWave", tip: "folia.rhine.rhythmWaveHint" },
  lift: { label: "folia.rhine.rhythmLift", tip: "folia.rhine.rhythmLiftHint" },
  beat: { label: "folia.rhine.rhythmBeat", tip: "folia.rhine.rhythmBeatHint" },
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

  return (
    <>
      <FoliaQuickChip
        label={colorLabel}
        title={`${t("folia.rhine.colorMode")}: ${colorLabel}`}
        onClick={() => change({ colorMode: getSteppedMode(COLOR_MODES, tuning.colorMode, 1) })}
      />
      <div className="w-full">
        <div className="mb-1.5 text-xs text-[color:var(--st-t3)]">
          {t("folia.rhine.rhythmStyle")}
        </div>
        <FoliaSegments
          fill
          value={tuning.rhythmStyle}
          onChange={(rhythmStyle) => change({ rhythmStyle })}
          options={RHINE_RHYTHM_STYLES.map((style) => ({
            value: style,
            label: t(RHINE_RHYTHM_LABELS[style].label),
            tip: t(RHINE_RHYTHM_LABELS[style].tip),
          }))}
        />
      </div>
    </>
  );
}
