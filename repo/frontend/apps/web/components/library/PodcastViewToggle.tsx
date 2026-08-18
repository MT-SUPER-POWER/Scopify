"use client";

import { Grid2X2, List } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/store/module/i18n";
import type { PodcastViewToggleProps } from "@/types/components/library";
import type { PodcastViewMode } from "@/types/library";

const viewIcons: Record<PodcastViewMode, typeof List> = {
  cards: Grid2X2,
  list: List,
};

export function PodcastViewToggle({ onChange, value }: PodcastViewToggleProps) {
  const { t } = useI18n();

  return (
    <div className="inline-flex items-center rounded-md border border-content/10 bg-content/5 p-1">
      {(["list", "cards"] as PodcastViewMode[]).map((view) => {
        const Icon = viewIcons[view];
        const label = t(`library.podcasts.view.${view}`);
        const isActive = value === view;

        return (
          <button
            key={view}
            type="button"
            aria-label={label}
            aria-pressed={isActive}
            title={label}
            onClick={() => onChange(view)}
            className={cn(
              "flex size-8 items-center justify-center rounded-sm text-content-muted transition-colors hover:text-content",
              isActive && "bg-content text-surface hover:text-surface",
            )}
          >
            <Icon className="size-4" />
          </button>
        );
      })}
    </div>
  );
}
