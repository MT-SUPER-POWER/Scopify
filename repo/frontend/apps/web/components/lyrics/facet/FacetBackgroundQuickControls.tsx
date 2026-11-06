"use client";

import { AudioLines } from "lucide-react";
import {
  FoliaQuickChip,
  FoliaQuickToggle,
} from "@scopify/ui/scopify/components/folia-panel/controls";
import { getSteppedMode } from "@scopify/ui/scopify/components/folia-panel/mode-stepper-row";
import { DEFAULT_FACET_BACKGROUND_TUNING } from "@/constants/facetBackground";
import type { VisualizerBackgroundQuickControlsProps } from "@/components/lyrics/folia/src/components/visualizer/backgrounds/definition";

const QUALITIES = ["performance", "balanced", "high"] as const;
const QUALITY_LABELS = {
  performance: "folia.facet.qualityPerformance",
  balanced: "folia.facet.qualityBalanced",
  high: "folia.facet.qualityHigh",
} as const;

/** The same persisted tuning as the full Facet editor, exposed through the background toolbar. */
export function FacetBackgroundQuickControls({
  config,
  actions,
  t,
}: VisualizerBackgroundQuickControlsProps) {
  const tuning = { ...DEFAULT_FACET_BACKGROUND_TUNING, ...config?.facet?.tuning };
  const change = actions?.facet?.onTuningChange;
  const qualityLabel = t(QUALITY_LABELS[tuning.quality]);

  return (
    <>
      <FoliaQuickChip
        label={qualityLabel}
        title={`${t("folia.facet.quality")}: ${qualityLabel}`}
        onClick={() => change?.({ quality: getSteppedMode(QUALITIES, tuning.quality, 1) })}
      />
      <FoliaQuickToggle
        active={tuning.musicEnabled}
        label={t("folia.facet.musicEnabled")}
        onToggle={() => change?.({ musicEnabled: !tuning.musicEnabled })}
      >
        <AudioLines size={14} />
      </FoliaQuickToggle>
    </>
  );
}
