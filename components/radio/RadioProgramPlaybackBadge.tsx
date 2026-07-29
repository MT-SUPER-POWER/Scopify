"use client";

import { MediaInfoBadge } from "@/components/shared/MediaInfoBadge";
import { cn } from "@/lib/utils";
import { useI18n } from "@/store/module/i18n";
import type { RadioProgramPlaybackProgress } from "@/types/radio";

interface RadioProgramPlaybackBadgeProps {
  progress: RadioProgramPlaybackProgress;
}

export function RadioProgramPlaybackBadge({ progress }: RadioProgramPlaybackBadgeProps) {
  const { t } = useI18n();
  const label =
    progress.kind === "complete"
      ? t("library.podcasts.progress.complete")
      : progress.kind === "partial"
        ? t("library.podcasts.progress.partial", { percentage: progress.percentage })
        : undefined;
  const value =
    progress.kind === "complete"
      ? "100%"
      : progress.kind === "partial"
        ? `${progress.percentage}%`
        : "—";

  return (
    <MediaInfoBadge
      ariaLabel={label}
      className={cn(
        "h-auto min-w-12 justify-center rounded-sm px-2 py-0.5 text-[11px] leading-none font-medium tabular-nums",
        progress.kind === "none" && "border-zinc-700 bg-white/5 text-zinc-500",
      )}
      title={label}
      tone={progress.kind === "complete" ? "gold" : "red"}
    >
      {value}
    </MediaInfoBadge>
  );
}
