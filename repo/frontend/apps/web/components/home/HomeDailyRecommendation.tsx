"use client";

import { Play } from "lucide-react";
import { useSmartRouter } from "@/lib/hooks/useSmartRouter";
import { useI18n } from "@/store/module/i18n";
import type { HomeDailyRecommendationProps } from "@/types/components/home";

export function HomeDailyRecommendation({ dateInfo }: HomeDailyRecommendationProps) {
  const { t } = useI18n();
  const smartRouter = useSmartRouter();
  return (
    <div
      data-section-item
      onClick={() => smartRouter.push("/playlist/?isDailyRecommend=true")}
      className="group relative flex h-16 cursor-pointer items-center overflow-hidden rounded-md bg-content/10 pr-4 transition-colors hover:bg-content/20"
    >
      <div className="z-10 flex size-16 shrink-0 flex-col overflow-hidden rounded-l-md bg-calendar-surface shadow-calendar select-none">
        <div className="flex h-5.5 items-center justify-center border-b border-calendar-divider bg-linear-to-b from-calendar-accent to-calendar-accent-hover">
          <span className="text-[10px] font-medium tracking-[0.15em] text-calendar-surface">
            {dateInfo.dayOfWeek}
          </span>
        </div>
        <div className="relative flex flex-1 items-center justify-center bg-linear-to-b from-calendar-surface from-50% to-calendar-surface-muted to-50%">
          <div className="absolute top-1/2 left-0 h-px w-full -translate-y-1/2 bg-calendar-divider" />
          <span className="z-10 mt-1 text-3xl leading-none font-black tracking-tighter text-calendar-ink">
            {dateInfo.dateNum}
          </span>
        </div>
      </div>
      <span className="ml-4 truncate text-sm font-medium text-content">
        {t("home.dailyRecommendations")}
      </span>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          smartRouter.push("/playlist/?isDailyRecommend=true");
        }}
        className="absolute right-4 z-20 flex size-10 translate-y-2 items-center justify-center rounded-full bg-brand text-brand-foreground opacity-0 shadow-brand transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 hover:scale-105 hover:bg-brand-hover"
      >
        <Play className="ml-1 size-5 fill-current" />
      </button>
    </div>
  );
}
