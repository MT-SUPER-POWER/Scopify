"use client";

import { PodcastViewToggle } from "@/components/library/PodcastViewToggle";
import { useI18n } from "@/store/module/i18n";
import type { PodcastViewMode } from "@/types/library/model";

interface PodcastsHeaderProps {
  onViewChange: (value: PodcastViewMode) => void;
  showViewToggle: boolean;
  view: PodcastViewMode;
}

export function PodcastsHeader({ onViewChange, showViewToggle, view }: PodcastsHeaderProps) {
  const { t } = useI18n();

  return (
    <header className="flex flex-wrap items-center justify-between gap-4 pb-5">
      <h1 className="text-3xl font-bold text-content">{t("library.title.podcasts")}</h1>
      {showViewToggle ? <PodcastViewToggle value={view} onChange={onViewChange} /> : null}
    </header>
  );
}
