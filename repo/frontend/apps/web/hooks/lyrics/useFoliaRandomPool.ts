"use client";

import { useMemo } from "react";
import { toast } from "sonner";

import {
  getVisualizerModeLabel,
  VISUALIZER_REGISTRY,
} from "@/components/lyrics/folia/src/components/visualizer/registry";
import {
  pickRandomVisualizerMode,
  resolveRandomVisualizerPool,
} from "@/lib/lyrics/randomVisualizerPool";
import { useI18n } from "@/store/module/i18n";
import { useLyricStageStore } from "@/store/module/lyrics";
import type { LyricVisualizerMode } from "@/types/lyrics/model";

/**
 * The random pool as the panel shows it (Folia visualizer/random/useRandomPool.ts): every style in
 * registry order, which are on, a count, and drawing another style for the playing song.
 */
export function useFoliaRandomPool() {
  const { t } = useI18n();
  const saved = useLyricStageStore((state) => state.randomVisualizerModes);
  const mode = useLyricStageStore((state) => state.mode);
  const options = useMemo(
    () =>
      VISUALIZER_REGISTRY.map((entry) => ({
        label: getVisualizerModeLabel(entry.mode, t),
        value: entry.mode,
      })),
    [t],
  );
  const allModes = useMemo(() => options.map((option) => option.value), [options]);
  const modes = resolveRandomVisualizerPool(saved, allModes);
  const setModes = (next: readonly LyricVisualizerMode[]) =>
    useLyricStageStore.getState().patchSettings({ randomVisualizerModes: [...next] });

  return {
    allOn: modes.length === allModes.length,
    canReroll: modes.some((entry) => entry !== mode),
    countLabel: t("folia.options.randomPoolCount", {
      selected: modes.length,
      total: allModes.length,
    }),
    modes,
    options,
    refuse: () => toast.info(t("folia.options.randomVisualizerAtLeastOne")),
    /** Another style from the pool for this song, never the one it has; random stays on. */
    reroll: () => {
      const next = pickRandomVisualizerMode(modes, mode);
      if (next !== mode) useLyricStageStore.getState().requestVisualizerMode(next);
    },
    selectAll: () => setModes(allModes),
    setModes,
  };
}
