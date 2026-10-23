"use client";

import type { TranslationKey } from "@/lib/i18n";
import { useI18n } from "@/store/module/i18n";

import {
  DEFAULT_VISUALIZER_BACKGROUND_MODE,
  getVisualizerBackgroundRegistryEntry,
} from "@/components/lyrics/folia/src/components/visualizer/backgrounds/registry";
import type { VisualizerBackgroundActions } from "@/components/lyrics/folia/src/components/visualizer/backgrounds/definition";
import { useLyricStageStore } from "@/store/module/lyrics";

import type { FoliaBackgroundQuickControlProps } from "@/types/components/lyrics";

export function FoliaBackgroundQuickControl({
  assets,
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
      onDisableVignetteChange: (disableVignette) =>
        settings.patchBackgroundCommon({ disableVignette }),
    },
    latent: { onTuningChange: settings.patchLatentBackground },
    monet: { onTuningChange: settings.patchMonetBackground },
    nomand: { onTuningChange: settings.patchNomandBackground },
    sora: { onTuningChange: settings.patchSoraBackground },
    rhine: { onTuningChange: settings.patchRhineBackground },
  };

  return entry.renderQuickControls?.({
    actions,
    config: { ...settings.background, customImage: assets.monetBackgroundImage },
    isDaylight,
    t: (key) => String(t((key.startsWith("folia.") ? key : `folia.${key}`) as TranslationKey)),
    theme,
  });
}
