"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { AllView } from "@/components/search/AllView";
import { CategoryTabs } from "@/components/search/CategoryTabs";
import { GridCategoryView } from "@/components/search/GridCategoryView";
import { LoadingSkeleton } from "@/components/search/LoadingSkeleton";
import { NetworkRetryState } from "@/components/shared/NetworkRetryState";
import { SongsView } from "@/components/search/SongsView";
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
  const { albums, artists, hasError, loading, playlists, refetch, songs } = useSearchData(
    keywords,
    activeCategory,
  );
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
      {loading && <LoadingSkeleton />}
      {!loading && activeCategory === "All" && (
        <AllView
          songs={songs}
          albums={albums}
          playlists={playlists}
          artists={artists}
          loadingPlayId={loadingPlayId}
          onPlayAlbum={handlePlayAlbum}
          onPlayPlaylist={handlePlayPlaylist}
          onSeeAll={setActiveCategory}
          onNavigate={router.push}
        />
      )}
      {!loading && activeCategory === "Songs" && <SongsView songs={songs} />}
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
