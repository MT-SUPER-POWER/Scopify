"use client";

import { useTranslation } from "react-i18next";

import type { SearchCategoryHeaderProps } from "@/types/search/components";

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
  const { t } = useTranslation();

  return (
    <>
      <h2 className="sr-only">{t(categoryTitleKeys[category])}</h2>
      {actions ? <div className="mb-6 flex justify-end">{actions}</div> : null}
    </>
  );
}
