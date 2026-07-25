import type { ComponentType } from "react";
import type { TranslationKey } from "@/lib/i18n";
import type { MusicQuality } from "@/types/player";

// ── Quality ──────────────────────────────────────────────────────────────────

export type QualityOptionKey = MusicQuality;

export interface QualityOption {
  value: QualityOptionKey;
  icon?: ComponentType<{ className?: string }>;
  badgeType?: "svip" | "vip";
  isHero?: boolean;
  labelKey: TranslationKey;
  sublabelKey?: TranslationKey;
  techSpec?: TranslationKey;
  shortLabel?: string;
}
