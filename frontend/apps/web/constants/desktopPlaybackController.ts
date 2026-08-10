import type { VisualizerBackgroundMode } from "@/components/lyrics/folia/src/types";
import type { LyricVisualizerMode } from "@/types/lyrics";

export const DESKTOP_FOLIA_VISUALIZER_OPTIONS = [
  { labelKey: "folia.ui.visualizerClassic", value: "classic" },
  { labelKey: "folia.ui.visualizerCadenze", value: "cadenza" },
  { labelKey: "folia.ui.visualizerPartita", value: "partita" },
  { labelKey: "folia.ui.visualizerFume", value: "fume" },
  { labelKey: "folia.ui.visualizerTilt", value: "tilt" },
  { labelKey: "folia.ui.visualizerCladdagh", value: "claddagh" },
  { labelKey: "folia.ui.visualizerMonet", value: "monet" },
  { labelKey: "folia.ui.visualizerPendolo", value: "pendolo" },
  { labelKey: "folia.ui.visualizerCappella", value: "cappella" },
  { labelKey: "folia.ui.visualizerDiorama", value: "diorama" },
  { labelKey: "folia.ui.visualizerSonnet", value: "sonnet" },
] as const satisfies readonly { labelKey: string; value: LyricVisualizerMode }[];

export const DESKTOP_FOLIA_BACKGROUND_OPTIONS = [
  { labelKey: "folia.options.visualizerBackgroundModeCommon", value: "common" },
  { labelKey: "folia.options.visualizerBackgroundModeMonet", value: "monet" },
  { labelKey: "folia.options.visualizerBackgroundModeNomand", value: "nomand" },
  { labelKey: "folia.options.visualizerBackgroundModeLatent", value: "latent" },
  { labelKey: "folia.options.visualizerBackgroundModeUrl", value: "url" },
  { labelKey: "folia.options.visualizerBackgroundModeSora", value: "sora" },
] as const satisfies readonly { labelKey: string; value: VisualizerBackgroundMode }[];

export const DESKTOP_FOLIA_ANIMATION_OPTIONS = [
  { labelKey: "folia.animation.calm", value: "calm" },
  { labelKey: "folia.animation.normal", value: "normal" },
  { labelKey: "folia.animation.chaotic", value: "chaotic" },
] as const;
