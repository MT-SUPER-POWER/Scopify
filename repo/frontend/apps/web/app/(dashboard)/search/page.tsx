"use client";

import { useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { AllView } from "@/components/search/AllView";
import { CategoryTabs } from "@/components/search/CategoryTabs";
import { GridCategoryView } from "@/components/search/GridCategoryView";
import { AllViewSkeleton, LoadingSkeleton } from "@/components/search/LoadingSkeleton";
import { NetworkRetryState } from "@/components/shared/NetworkRetryState";
import { PodcastsView } from "@/components/search/PodcastsView";
import { SongsView } from "@/components/search/SongsView";
import { VoicesView } from "@/components/search/VoicesView";
import { usePlayActions } from "@/hooks/search/usePlayActions";
import { useSearchData } from "@/hooks/search/useSearchData";
import { useSmartRouter } from "@/lib/hooks/useSmartRouter";
import { buildSearchCategoryUrl, getSearchCategory } from "@/lib/search/searchCategory";
import { useI18n } from "@/store/module/i18n";
import type { Category } from "@/types/search";

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
  const {
    albums,
    artists,
    bestMatch,
    fetchNextAlbumPage,
    fetchNextArtistPage,
    fetchNextPlaylistPage,
    fetchNextPodcastPage,
    fetchNextSongPage,
    fetchNextVoicePage,
    hasNextAlbumPage,
    hasNextArtistPage,
    hasNextPlaylistPage,
    hasNextPodcastPage,
    hasNextSongPage,
    hasNextVoicePage,
    hasError,
    loading,
    isFetchingNextAlbumPage,
    isFetchingNextArtistPage,
    isFetchingNextPlaylistPage,
    isFetchingNextPodcastPage,
    isFetchingNextSongPage,
    isFetchingNextVoicePage,
    playlists,
    podcasts,
    refetch,
    songs,
    voices,
  } = useSearchData(keywords, activeCategory);
  const { loadingPlayId, handlePlayPlaylist, handlePlayAlbum } = usePlayActions();

  const isGridCategory = (["Albums", "Playlists", "Artists"] as Category[]).includes(
    activeCategory,
  );
  const hasNextGridPage =
    activeCategory === "Albums"
      ? hasNextAlbumPage
      : activeCategory === "Playlists"
        ? hasNextPlaylistPage
        : hasNextArtistPage;
  const isFetchingNextGridPage =
    activeCategory === "Albums"
      ? isFetchingNextAlbumPage
      : activeCategory === "Playlists"
        ? isFetchingNextPlaylistPage
        : isFetchingNextArtistPage;
  const loadNextGridPage = () => {
    if (activeCategory === "Albums") {
      void fetchNextAlbumPage();
      return;
    }
    if (activeCategory === "Playlists") {
      void fetchNextPlaylistPage();
      return;
    }
    if (activeCategory === "Artists") void fetchNextArtistPage();
  };

  return (
    <div className="mx-auto min-h-full w-full max-w-400 p-6 pt-22 text-content">
      <CategoryTabs active={activeCategory} onChange={handleCategoryChange} />
      {hasError && (
        <div className="mb-6">
          <NetworkRetryState
            compact
            title={t("network.offline.title")}
            subtitle={t("network.offline.subtitle")}
            actionLabel={t("network.action.refresh")}
            isRetrying={loading}
            onRetry={() => void refetch()}
          />
        </div>
      )}
      {loading && activeCategory === "All" && <AllViewSkeleton />}
      {loading && activeCategory !== "All" && <LoadingSkeleton />}
      {!loading && activeCategory === "All" && (
        <AllView
          songs={songs}
          albums={albums}
          playlists={playlists}
          artists={artists}
          bestMatch={bestMatch}
          podcasts={podcasts}
          loadingPlayId={loadingPlayId}
          onPlayAlbum={handlePlayAlbum}
          onPlayPlaylist={handlePlayPlaylist}
          onSeeAll={handleCategoryChange}
          onNavigate={router.push}
          voices={voices}
        />
      )}
      {!loading && activeCategory === "Songs" && (
        <SongsView
          songs={songs}
          hasNextPage={hasNextSongPage}
          isFetchingNextPage={isFetchingNextSongPage}
          onLoadMore={() => void fetchNextSongPage()}
        />
      )}
      {!loading && activeCategory === "Podcasts" && (
        <PodcastsView
          podcasts={podcasts}
          hasNextPage={hasNextPodcastPage}
          isFetchingNextPage={isFetchingNextPodcastPage}
          onLoadMore={() => void fetchNextPodcastPage()}
        />
      )}
      {!loading && activeCategory === "Voices" && (
        <VoicesView
          voices={voices}
          hasNextPage={hasNextVoicePage}
          isFetchingNextPage={isFetchingNextVoicePage}
          onLoadMore={() => void fetchNextVoicePage()}
        />
      )}
      {!loading && isGridCategory && (
        <GridCategoryView
          activeCategory={activeCategory as "Albums" | "Playlists" | "Artists"}
          albums={albums}
          playlists={playlists}
          artists={artists}
          loadingPlayId={loadingPlayId}
          onPlayAlbum={handlePlayAlbum}
          onPlayPlaylist={handlePlayPlaylist}
          onNavigate={router.push}
          hasNextPage={hasNextGridPage}
          isFetchingNextPage={isFetchingNextGridPage}
          onLoadMore={loadNextGridPage}
        />
      )}
    </div>
  );
}
