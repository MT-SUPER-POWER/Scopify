import type { LucideIcon } from "lucide-react";
import type { TranslationKey } from "@/lib/i18n";

// ── Quality ──────────────────────────────────────────────────────────────────

export type QualityOptionKey = "spatial" | "lossless" | "high" | "standard";

export interface QualityOption {
  value: QualityOptionKey;
  icon: LucideIcon;
  labelKey: TranslationKey;
  sublabelKey: TranslationKey;
  descriptionKey: TranslationKey;
}
