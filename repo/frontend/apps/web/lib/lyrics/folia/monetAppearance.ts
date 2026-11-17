import type { MonetChromeVisibility } from "@/components/lyrics/folia/src/types";

export const MONET_CUSTOM_DESCRIPTION_MAX_LENGTH = 120;

/** Migrate the legacy binary switches. An already-enabled control used to stay visible. */
export function resolveMonetChromeVisibility(
  value: unknown,
  shown: unknown,
  fallback: MonetChromeVisibility = "auto",
): MonetChromeVisibility {
  if (shown === false) return "hidden";
  if (value === "auto" || value === "always" || value === "hidden") return value;
  return shown === true ? "always" : fallback;
}
