"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
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
import { useI18n } from "@/store/module/i18n";
import type { Category } from "@/types/search";

export default function SearchPage() {
  const { t } = useI18n();
  const keywords = useSearchParams().get("keywords") || "";
  const router = useSmartRouter();
  const [activeCategory, setActiveCategory] = useState<Category>("All");
  const {
    albums,
    artists,
    bestMatch,
    hasError,
    loading,
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

  return (
    <div className="mx-auto min-h-full w-full max-w-[1600px] p-6 pt-22 text-white">
      <CategoryTabs active={activeCategory} onChange={setActiveCategory} />
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
          onSeeAll={setActiveCategory}
          onNavigate={router.push}
          voices={voices}
        />
      )}
      {!loading && activeCategory === "Songs" && <SongsView songs={songs} />}
      {!loading && activeCategory === "Podcasts" && <PodcastsView podcasts={podcasts} />}
      {!loading && activeCategory === "Voices" && <VoicesView voices={voices} />}
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
        />
      )}
    </div>
  );
}
