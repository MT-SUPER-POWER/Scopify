import type { MonetChromeVisibility } from "../../../types";
import type { TranslationKey } from "@/lib/i18n";
import { defineVisualizerTuning } from "../tuningRegistry";

// Injects Monet's strongly typed tuning at the renderer boundary.
export default defineVisualizerTuning({
  mode: "monet",
  settingsKey: "monetTuning",
  settingsSetterKey: "handleSetMonetTuning",
  apply: (props, tuning) => ({ ...props, monetTuning: tuning }),
});

export const MONET_CHROME_VISIBILITY_KEYS = {
  auto: "folia.options.monetChromeVisibilityAuto",
  always: "folia.options.monetChromeVisibilityAlways",
  hidden: "folia.options.monetChromeVisibilityHidden",
} as const satisfies Record<MonetChromeVisibility, TranslationKey>;
export const MONET_CHROME_VISIBILITIES = ["auto", "always", "hidden"] as const;

export function nextMonetChromeVisibility(value: MonetChromeVisibility): MonetChromeVisibility {
  if (value === "auto") return "always";
  return value === "always" ? "hidden" : "auto";
}
