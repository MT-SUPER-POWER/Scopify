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
        "inline-flex h-[13px] shrink-0 items-center rounded-[1px] border px-[2px] text-[9px] leading-[11px] font-normal",
        badge.tone === "gold"
          ? "border-[#a67d16] bg-[#c4931c]/10 text-[#dfb42b]"
          : "border-[#9c4141] bg-[#c24c4c]/8 text-[#d86666]",
        className,
      )}
      title={label}
    >
      {label}
    </span>
  );
}
