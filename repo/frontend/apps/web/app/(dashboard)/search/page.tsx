"use client";

import { useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { NetworkRetryState } from "@/components/shared/NetworkRetryState";
import { usePlayActions } from "@/hooks/search/usePlayActions";
import { useSearchData } from "@/hooks/search/useSearchData";
import { useSmartRouter } from "@/hooks/core/useSmartRouter";
import { buildSearchCategoryUrl, getSearchCategory } from "@/lib/search/searchCategory";
import { useI18n } from "@/store/module/i18n";
import type { Category } from "@/types/search/model";
import { AllView } from "./_components/AllView";
import { GridCategoryView } from "./_components/GridCategoryView";
import { CategorySkeleton } from "./_components/LoadingSkeleton";
import { LyricsView } from "./_components/LyricsView";
import { MvsView } from "./_components/MvsView";
import { PodcastsView } from "./_components/PodcastsView";
import { SheetsView } from "./_components/SheetsView";
import { SongsView } from "./_components/SongsView";
import { VoicesView } from "./_components/VoicesView";

export default function SearchPage() {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const keywords = searchParams.get("keywords") || "";
  const router = useSmartRouter();
  const activeCategory = getSearchCategory(searchParams.get("tab"));
  const handleCategoryChange = useCallback(
    (category: Category) => {
      router.replace(buildSearchCategoryUrl(searchParams.toString(), category));
    },
    [router, searchParams],
  );
  const search = useSearchData(keywords, activeCategory);
  const { loadingPlayId, handlePlayPlaylist, handlePlayAlbum } = usePlayActions();

  const gridPagination = {
    Albums: {
      hasNextPage: search.hasNextAlbumPage,
      isFetchingNextPage: search.isFetchingNextAlbumPage,
      fetchNextPage: search.fetchNextAlbumPage,
    },
    Playlists: {
      hasNextPage: search.hasNextPlaylistPage,
      isFetchingNextPage: search.isFetchingNextPlaylistPage,
      fetchNextPage: search.fetchNextPlaylistPage,
    },
    Artists: {
      hasNextPage: search.hasNextArtistPage,
      isFetchingNextPage: search.isFetchingNextArtistPage,
      fetchNextPage: search.fetchNextArtistPage,
    },
  } as const;
  const gridCategory =
    activeCategory === "Albums" || activeCategory === "Playlists" || activeCategory === "Artists"
      ? activeCategory
      : null;
  const grid = gridCategory ? gridPagination[gridCategory] : null;

  return (
    <>
      {search.hasError && (
        <div className="mb-6">
          <NetworkRetryState
            compact
            title={t("network.offline.title")}
            subtitle={t("network.offline.subtitle")}
            actionLabel={t("network.action.refresh")}
            isRetrying={search.loading}
            onRetry={() => void search.refetch()}
          />
        </div>
      )}
      {search.loading && <CategorySkeleton category={activeCategory} />}
      {!search.loading && activeCategory === "All" && (
        <AllView
          songs={search.songs}
          albums={search.albums}
          playlists={search.playlists}
          artists={search.artists}
          bestMatch={search.bestMatch}
          podcasts={search.podcasts}
          loadingPlayId={loadingPlayId}
          mvs={search.mvs}
          onPlayAlbum={handlePlayAlbum}
          onPlayPlaylist={handlePlayPlaylist}
          onSeeAll={handleCategoryChange}
          onNavigate={router.push}
          voices={search.voices}
        />
      )}
      {activeCategory === "Sheets" && <SheetsView keyword={keywords} />}
      {!search.loading && activeCategory === "Songs" && (
        <SongsView
          songs={search.songs}
          hasNextPage={search.hasNextSongPage}
          isFetchingNextPage={search.isFetchingNextSongPage}
          onLoadMore={() => void search.fetchNextSongPage()}
        />
      )}
      {!search.loading && activeCategory === "Lyrics" && (
        <LyricsView
          items={search.lyrics}
          keyword={keywords}
          hasNextPage={search.hasNextLyricPage}
          isFetchingNextPage={search.isFetchingNextLyricPage}
          onLoadMore={() => void search.fetchNextLyricPage()}
        />
      )}
      {!search.loading && activeCategory === "MVs" && (
        <MvsView
          mvs={search.mvs}
          hasNextPage={search.hasNextMvPage}
          isFetchingNextPage={search.isFetchingNextMvPage}
          onLoadMore={() => void search.fetchNextMvPage()}
        />
      )}
      {!search.loading && activeCategory === "Podcasts" && (
        <PodcastsView
          podcasts={search.podcasts}
          hasNextPage={search.hasNextPodcastPage}
          isFetchingNextPage={search.isFetchingNextPodcastPage}
          onLoadMore={() => void search.fetchNextPodcastPage()}
        />
      )}
      {!search.loading && activeCategory === "Voices" && (
        <VoicesView
          voices={search.voices}
          hasNextPage={search.hasNextVoicePage}
          isFetchingNextPage={search.isFetchingNextVoicePage}
          onLoadMore={() => void search.fetchNextVoicePage()}
        />
      )}
      {!search.loading && gridCategory && grid && (
        <GridCategoryView
          activeCategory={gridCategory}
          albums={search.albums}
          playlists={search.playlists}
          artists={search.artists}
          loadingPlayId={loadingPlayId}
          onPlayAlbum={handlePlayAlbum}
          onPlayPlaylist={handlePlayPlaylist}
          onNavigate={router.push}
          hasNextPage={grid.hasNextPage}
          isFetchingNextPage={grid.isFetchingNextPage}
          onLoadMore={() => void grid.fetchNextPage()}
        />
      )}
    </>
  );
}
