"use client";

import { MediaInfoBadge } from "@/components/shared/MediaInfoBadge";
import { getSongQualityBadge } from "@/lib/song/qualityBadge";
import { useI18n } from "@/store/module/i18n";

import type { SongQualityBadgeProps } from "@/types/songQuality";

const qualityLabelKeys = {
  jymaster: "playbar.quality.badge.jymaster",
  dolby: "playbar.quality.badge.dolby",
  vivid: "playbar.quality.badge.vivid",
  sky: "playbar.quality.badge.sky",
  jyeffect: "playbar.quality.badge.jyeffect",
  hires: "playbar.quality.badge.hires",
  lossless: "playbar.quality.badge.lossless",
} as const;

export function SongQualityBadge({ className, qualityLevel }: SongQualityBadgeProps) {
  const { t } = useI18n();
  const badge = getSongQualityBadge(qualityLevel);

  if (!badge) return null;

  const label = t(qualityLabelKeys[badge.level]);

  return (
    <MediaInfoBadge
      className={className}
      title={label}
      tone={badge.tone === "gold" ? "gold" : "red"}
    >
      {label}
    </MediaInfoBadge>
  );
}
