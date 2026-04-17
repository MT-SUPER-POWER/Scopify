"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { AllView } from "@/components/search/AllView";
import { CategoryTabs } from "@/components/search/CategoryTabs";
import { GridCategoryView } from "@/components/search/GridCategoryView";
import { LoadingSkeleton } from "@/components/search/LoadingSkeleton";
import { SongsView } from "@/components/search/SongsView";
import { usePlayActions } from "@/hooks/search/usePlayActions";
import { useSearchData } from "@/hooks/search/useSearchData";
import { useSmartRouter } from "@/lib/hooks/useSmartRouter";
import type { Category } from "@/types/search";

export default function SearchResultsPage() {
  const keywords = useSearchParams().get("keywords") || "";
  const router = useSmartRouter();

  const [activeCategory, setActiveCategory] = useState<Category>("All");

  const { loading, songs, albums, playlists, artists } = useSearchData(keywords, activeCategory);
  const { loadingPlayId, handlePlayPlaylist, handlePlayAlbum } = usePlayActions();

  const isGridCategory = (["Albums", "Playlists", "Artists"] as Category[]).includes(
    activeCategory,
  );

  return (
    <div className="w-full min-h-screen bg-[#121212] text-white p-6 overflow-y-auto pt-22">
      <CategoryTabs active={activeCategory} onChange={setActiveCategory} />

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
