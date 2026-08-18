"use client";

import { useI18n } from "@/store/module/i18n";

import {
  DEFAULT_VISUALIZER_BACKGROUND_MODE,
  getVisualizerBackgroundRegistryEntry,
} from "@/components/lyrics/folia/src/components/visualizer/backgrounds/registry";
import type { VisualizerBackgroundActions } from "@/components/lyrics/folia/src/components/visualizer/backgrounds/definition";
import type { Theme } from "@/components/lyrics/folia/src/types";
import { useLyricStageStore } from "@/store/module/lyrics";

interface FoliaBackgroundQuickControlProps {
  isDaylight: boolean;
  theme: Theme;
}

export function FoliaBackgroundQuickControl({
  isDaylight,
  theme,
}: FoliaBackgroundQuickControlProps) {
  const { t } = useI18n();
  const settings = useLyricStageStore();
  const mode = settings.background.mode ?? DEFAULT_VISUALIZER_BACKGROUND_MODE;
  const entry = getVisualizerBackgroundRegistryEntry(mode);
  const actions: VisualizerBackgroundActions = {
    common: {
      onCoverColorChange: (useCoverColorBg) => settings.patchBackgroundCommon({ useCoverColorBg }),
    },
    latent: { onTuningChange: settings.patchLatentBackground },
    monet: { onTuningChange: settings.patchMonetBackground },
    nomand: { onTuningChange: settings.patchNomandBackground },
    sora: { onTuningChange: settings.patchSoraBackground },
  };

  return entry.renderQuickControls?.({
    actions,
    config: settings.background,
    isDaylight,
    t: (key) => String(t(`folia.${key}`)),
    theme,
  });
}
