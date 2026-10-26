"use client";

import { useI18n } from "@/store/module/i18n";
import type { SearchCategoryHeaderProps } from "@/types/components/search";

const categoryTitleKeys = {
  Albums: "search.section.searchAlbums",
  Artists: "search.section.searchArtists",
  Lyrics: "search.section.searchLyrics",
  Sheets: "songResources.sheets",
  MVs: "search.section.searchMvs",
  Playlists: "search.section.searchPlaylists",
  Podcasts: "search.section.searchPodcasts",
  Songs: "search.section.searchSongs",
  Voices: "search.section.searchVoices",
} as const;

export function SearchCategoryHeader({ actions, category }: SearchCategoryHeaderProps) {
  const { t } = useI18n();

  return (
    <>
      <h2 className="sr-only">{t(categoryTitleKeys[category])}</h2>
      {actions ? <div className="mb-6 flex justify-end">{actions}</div> : null}
    </>
  );
}
