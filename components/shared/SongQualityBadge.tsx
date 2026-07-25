"use client";

import { getSongQualityBadge } from "@/lib/song/qualityBadge";
import { cn } from "@/lib/utils";
import { useI18n } from "@/store/module/i18n";

interface SongQualityBadgeProps {
  className?: string;
  qualityLevel: string | null | undefined;
}

const qualityLabelKeys = {
  jymaster: "playbar.quality.badge.jymaster",
  dolby: "playbar.quality.badge.dolby",
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
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-sm border px-1 py-px text-[10px] leading-none font-medium",
        badge.tone === "gold"
          ? "border-amber-300/50 bg-amber-300/10 text-amber-200"
          : "border-red-400/50 bg-red-500/10 text-red-300",
        className,
      )}
      title={label}
    >
      {label}
    </span>
  );
}
