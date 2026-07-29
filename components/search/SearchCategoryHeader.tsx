"use client";

import { useI18n } from "@/store/module/i18n";
import type { SearchCategoryHeaderProps } from "@/types/components/search";

const categoryTitleKeys = {
  Albums: "search.section.searchAlbums",
  Artists: "search.section.searchArtists",
  Playlists: "search.section.searchPlaylists",
  Podcasts: "search.section.searchPodcasts",
  Songs: "search.section.searchSongs",
  Voices: "search.section.searchVoices",
} as const;

export function SearchCategoryHeader({ actions, category }: SearchCategoryHeaderProps) {
  const { t } = useI18n();

  return (
    <div className="mb-6 flex items-center justify-between gap-4">
      <h2 className="text-2xl font-bold tracking-tight">{t(categoryTitleKeys[category])}</h2>
      {actions}
    </div>
  );
}
